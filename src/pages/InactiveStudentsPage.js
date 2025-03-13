import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Alert, Spinner, Card, Form, Badge } from 'react-bootstrap';
import { FiUserCheck, FiTrash2 } from 'react-icons/fi';
import DataService from '../services/DataService';
import MergeStudentDialog from '../components/MergeStudentDialog';
import { generateUniqueKeyForItem } from '../utils/uniqueKeyGenerator';

const InactiveStudentsPage = () => {
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringStudent, setRestoringStudent] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  
  // Estados para la selección múltiple y eliminación en lotes
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);

  // Cargar estudiantes inactivos al iniciar
  useEffect(() => {
    loadInactiveStudents();
  }, []);

  // Función para cargar estudiantes inactivos
  const loadInactiveStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const inactiveStudents = await DataService.getInactiveStudents();
      setInactiveStudents(inactiveStudents);
      // Reiniciar selecciones cuando se cargan nuevos datos
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error al cargar estudiantes inactivos:', error);
      setError('No se pudieron cargar los estudiantes inactivos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para restaurar un estudiante inactivo
  const handleRestoreStudent = async (studentId) => {
    if (!studentId) {
      console.error('ID de estudiante no válido');
      setError('Error: ID de estudiante no válido');
      return;
    }
    
    setRestoringStudent(studentId);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('Intentando restaurar estudiante con ID:', studentId);
      const result = await DataService.restoreInactiveStudent(studentId);
      console.log('Resultado de restauración:', result);
      
      // Si se detecta un duplicado, mostrar el diálogo de fusión
      if (result && !result.success && result.duplicate) {
        console.log('Duplicado detectado:', {
          inactiveStudent: result.inactiveStudent,
          existingStudent: result.existingStudent
        });
        
        if (!result.inactiveStudent || !result.existingStudent) {
          console.error('Datos de estudiantes incompletos en la respuesta de duplicado');
          setError('Error: Datos de estudiantes incompletos');
          return;
        }
        
        setDuplicateData({
          studentId,
          inactiveStudent: result.inactiveStudent,
          existingStudent: result.existingStudent
        });
        setShowMergeDialog(true);
        setRestoringStudent(null);
        return;
      }
      
      // Si se restauró correctamente
      if (result && result.success) {
        // Mostrar mensaje de éxito
        if (result.merged) {
          setSuccessMessage('Estudiante fusionado y restaurado correctamente.');
        } else {
          setSuccessMessage('Estudiante restaurado correctamente.');
        }
        
        // Recargar la lista de estudiantes inactivos
        loadInactiveStudents();
      } else {
        const errorMsg = result && result.error 
          ? `Error al restaurar: ${result.error}` 
          : 'No se pudo restaurar el estudiante. Por favor, intenta de nuevo.';
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error al restaurar estudiante:', error);
      setError(`Error al restaurar estudiante: ${error.message || 'Error desconocido'}`);
    } finally {
      setRestoringStudent(null);
    }
  };

  // Función para manejar la decisión de fusión
  const handleMergeDecision = async (mergeStrategy, customData = null) => {
    if (!duplicateData || !duplicateData.studentId) {
      console.error('No hay datos de duplicado para fusionar');
      setError('Error al fusionar: datos incompletos');
      return;
    }
    
    setRestoringStudent(duplicateData.studentId);
    setShowMergeDialog(false);
    
    try {
      console.log('Enviando solicitud de fusión con estrategia:', mergeStrategy);
      console.log('Datos de duplicado:', duplicateData);
      
      if (mergeStrategy === 'custom' && customData) {
        console.log('Usando datos personalizados para la fusión:', customData);
      }
      
      const result = await DataService.restoreInactiveStudent(
        duplicateData.studentId, 
        mergeStrategy,
        customData
      );
      
      console.log('Resultado de la fusión:', result);
      
      if (result && result.success) {
        setSuccessMessage('Estudiante fusionado y restaurado correctamente.');
        loadInactiveStudents();
      } else {
        const errorMsg = result && result.error 
          ? `Error al fusionar: ${result.error}` 
          : 'No se pudo fusionar el estudiante. Por favor, intenta de nuevo.';
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error al fusionar estudiante:', error);
      setError(`Error al fusionar estudiante: ${error.message || 'Error desconocido'}`);
    } finally {
      setRestoringStudent(null);
      setDuplicateData(null);
    }
  };

  // Función para seleccionar/deseleccionar todos los estudiantes
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Seleccionar todos los estudiantes
      const allIds = inactiveStudents.map(student => student.id);
      setSelectedStudents(allIds);
    } else {
      // Deseleccionar todos
      setSelectedStudents([]);
    }
  };
  
  // Función para seleccionar/deseleccionar un estudiante individual
  const handleSelectStudent = (studentId, checked) => {
    if (checked) {
      // Añadir a seleccionados
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      // Quitar de seleccionados
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };
  
  // Función para eliminar definitivamente los estudiantes seleccionados
  const handleDeleteSelectedPermanently = async () => {
    if (selectedStudents.length === 0) {
      return;
    }
    
    // Confirmar la eliminación
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar definitivamente ${selectedStudents.length} estudiante(s)? Esta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) {
      return;
    }
    
    setDeletingBatch(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('Eliminando estudiantes inactivos seleccionados:', selectedStudents);
      
      // Obtener los estudiantes completos a partir de los IDs seleccionados
      const studentsToDelete = inactiveStudents.filter(student => 
        selectedStudents.includes(student.id)
      );
      
      console.log('Estudiantes inactivos a eliminar (objetos completos):', studentsToDelete);
      
      // Pasar los objetos completos de estudiantes en lugar de solo los IDs
      const result = await DataService.deleteInactiveStudentsBatch(studentsToDelete);
      
      if (result && result.success) {
        setSuccessMessage(`Se eliminaron definitivamente ${result.count} estudiante(s) con éxito.`);
        // Recargar la lista de estudiantes inactivos
        loadInactiveStudents();
      } else {
        const errorMsg = result && result.error 
          ? `Error al eliminar: ${result.error}` 
          : 'No se pudieron eliminar los estudiantes. Por favor, intenta de nuevo.';
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error al eliminar estudiantes en lote:', error);
      setError(`Error al eliminar estudiantes: ${error.message || 'Error desconocido'}`);
    } finally {
      setDeletingBatch(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Obtener motivo de inactivación en formato legible
  const getReasonText = (reason) => {
    switch (reason) {
      case 'deleted_by_user':
        return 'Eliminado por usuario';
      case 'missing_from_sipi':
        return 'No presente en archivo SIPI';
      default:
        return reason || 'Desconocido';
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Estudiantes Inactivos</h1>
          <p className="text-muted">
            Aquí puedes ver y restaurar estudiantes que han sido eliminados o marcados como inactivos.
          </p>
        </Col>
      </Row>

      {/* Mensajes de éxito y error */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <p className="mt-2">Cargando estudiantes inactivos...</p>
        </div>
      ) : inactiveStudents.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h3>No hay estudiantes inactivos</h3>
            <p>Todos los estudiantes están activos en el sistema.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Botón para eliminar seleccionados */}
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <div>
              <span className="me-2">
                {selectedStudents.length} estudiante(s) seleccionado(s)
              </span>
            </div>
            <Button
              variant="danger"
              disabled={selectedStudents.length === 0 || deletingBatch}
              onClick={handleDeleteSelectedPermanently}
            >
              {deletingBatch ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Eliminando...
                </>
              ) : (
                <>
                  <FiTrash2 className="me-1" /> Eliminar Seleccionados
                </>
              )}
            </Button>
          </div>
          
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    label=""
                  />
                </th>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Fecha de Inactivación</th>
                <th>Motivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inactiveStudents.map((student, index) => {
                // Usar el ID hexadecimal si está disponible, o generar uno único basado en el índice
                const studentKey = student.hexId || generateUniqueKeyForItem(student, index, 'inactive-student');
                return (
                  <tr key={studentKey}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                      />
                    </td>
                    <td>{student.id}</td>
                    <td>{student['Nombre Completo'] || `${student.Nombre || ''} ${student.Apellido || ''}`}</td>
                    <td>{formatDate(student.inactiveSince || student.FechaBaja)}</td>
                    <td>{getReasonText(student.reason)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleRestoreStudent(student.id)}
                          disabled={restoringStudent === student.id}
                        >
                          {restoringStudent === student.id ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-1"
                              />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <FiUserCheck className="me-1" /> Restaurar
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      )}

      {/* Diálogo de fusión de estudiantes */}
      {duplicateData && duplicateData.inactiveStudent && duplicateData.existingStudent && (
        <MergeStudentDialog
          show={showMergeDialog}
          onHide={() => {
            setShowMergeDialog(false);
            setDuplicateData(null);
          }}
          inactiveStudent={duplicateData.inactiveStudent}
          existingStudent={duplicateData.existingStudent}
          onMergeDecision={handleMergeDecision}
        />
      )}
    </Container>
  );
};

export default InactiveStudentsPage;
