import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Table, Tabs, Tab, FormCheck, Row, Col } from 'react-bootstrap';
import DataService from '../services/DataService';

const SIPIFileUploader = ({ show, onHide, onFileProcessed, students, file: propFile }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [changes, setChanges] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedChanges, setSelectedChanges] = useState({});
  const [selectedMissingStudents, setSelectedMissingStudents] = useState({}); 
  const [selectedNewStudents, setSelectedNewStudents] = useState({}); 
  const [selectedReactivatedStudents, setSelectedReactivatedStudents] = useState({});
  const [newStudentsTurno, setNewStudentsTurno] = useState({});
  const [showTurnoSelector, setShowTurnoSelector] = useState(false);

  useEffect(() => {
    if (changes && changes.changedStudents) {
      const initialSelectedChanges = {};
      
      changes.changedStudents.forEach((change, index) => {
        initialSelectedChanges[index] = {};
        
        Object.keys(change.changes).forEach(field => {
          initialSelectedChanges[index][field] = true;
        });
      });
      
      setSelectedChanges(initialSelectedChanges);
    }
    
    if (changes && changes.missingStudents) {
      const initialSelectedMissing = {};
      
      changes.missingStudents.forEach((_, index) => {
        initialSelectedMissing[index] = true; 
      });
      
      setSelectedMissingStudents(initialSelectedMissing);
    }
    
    if (changes && changes.newStudents) {
      const initialSelectedNew = {};
      
      changes.newStudents.forEach((_, index) => {
        initialSelectedNew[index] = true; 
      });
      
      setSelectedNewStudents(initialSelectedNew);
    }
    
    if (changes && changes.reactivatedStudents) {
      const initialSelectedReactivated = {};
      
      changes.reactivatedStudents.forEach((_, index) => {
        initialSelectedReactivated[index] = true; 
      });
      
      setSelectedReactivatedStudents(initialSelectedReactivated);
    }
  }, [changes]);

  useEffect(() => {
    if (propFile && show) {
      if (propFile.name.toLowerCase().endsWith('.xls') || propFile.name.toLowerCase().endsWith('.xlsx')) {
        setFile(propFile);
        setError(null);
        setSuccess(null);
        setShowConfirmation(false);
        setChanges(null);
        setFilePreview(null);
        
        processFile(propFile);
      } else {
        setError('El archivo proporcionado no es un archivo XLS válido.');
      }
    }
  }, [propFile, show, students]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.toLowerCase().endsWith('.xls') || selectedFile.name.toLowerCase().endsWith('.xlsx'))) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setShowConfirmation(false);
      setChanges(null);
      setFilePreview(null);
    } else {
      setFile(null);
      setError('Por favor, selecciona un archivo válido con extensión .xls o .xlsx');
    }
  };

  const processFile = async (fileToProcess) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setChanges(null);
    setShowConfirmation(false);

    try {
      try {
        const preview = await DataService.generateSIPIFilePreview(fileToProcess);
        setFilePreview(preview);
        console.log('Vista previa generada:', preview);
      } catch (previewErr) {
        console.error('Error al generar vista previa:', previewErr);
      }
      
      const result = await DataService.processSIPIFile(fileToProcess, students, false);
      
      setChanges(result);
      console.log('Cambios detectados:', result);
      
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error al procesar archivo SIPI:', err);
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!file) {
      setError('Por favor, selecciona un archivo SIPI');
      return;
    }

    await processFile(file);
  };

  const handleChangeSelection = (studentIndex, field, isSelected) => {
    setSelectedChanges(prev => {
      const updated = { ...prev };
      updated[studentIndex] = { ...updated[studentIndex], [field]: isSelected };
      return updated;
    });
  };
  
  const handleSelectAllChanges = (isSelected) => {
    if (!changes || !changes.changedStudents) return;
    
    const allChanges = {};
    
    changes.changedStudents.forEach((change, index) => {
      allChanges[index] = {};
      Object.keys(change.changes).forEach(field => {
        allChanges[index][field] = isSelected;
      });
    });
    
    setSelectedChanges(allChanges);
  };
  
  const handleSelectAllMissing = (isSelected) => {
    if (!changes || !changes.missingStudents) return;
    
    const allMissing = {};
    
    changes.missingStudents.forEach((_, index) => {
      allMissing[index] = isSelected;
    });
    
    setSelectedMissingStudents(allMissing);
  };
  
  const handleSelectAllNew = (isSelected) => {
    if (!changes || !changes.newStudents) return;
    
    const allNew = {};
    
    changes.newStudents.forEach((_, index) => {
      allNew[index] = isSelected;
    });
    
    setSelectedNewStudents(allNew);
  };
  
  const handleSelectAllReactivated = (isSelected) => {
    if (!changes || !changes.reactivatedStudents) return;
    
    const allReactivated = {};
    
    changes.reactivatedStudents.forEach((_, index) => {
      allReactivated[index] = isSelected;
    });
    
    setSelectedReactivatedStudents(allReactivated);
  };
  
  const handleConfirmChanges = async () => {
    setLoading(true);
    
    try {
      console.log('Aplicando cambios SIPI...');
      
      // Verificar que los datos necesarios estén disponibles
      if (!changes) {
        throw new Error('No hay cambios para aplicar');
      }
      
      if (!Array.isArray(students)) {
        throw new Error('La lista de estudiantes no es válida');
      }
      
      // Filtrar los estudiantes a actualizar según la selección del usuario
      // y agregar los campos excluidos
      const updatedChangedStudents = changes.changedStudents.map((change, index) => {
        const excluded = [];
        
        Object.keys(change.changes).forEach(field => {
          if (!selectedChanges[index][field]) {
            excluded.push(field);
          }
        });
        
        return {
          ...change,
          excluded
        };
      });
      
      // Filtrar los estudiantes ausentes en SIPI según la selección del usuario
      const selectedMissingStudentsArray = changes.missingStudents.filter((_, index) => 
        selectedMissingStudents[index]
      );
      
      // Filtrar los estudiantes nuevos según la selección del usuario
      const selectedNewStudentsArray = changes.newStudents.filter((student, index) => 
        selectedNewStudents[index]
      ).map((student, index) => {
        // Encontrar el índice original en el array de changes.newStudents
        const originalIndex = changes.newStudents.findIndex(s => 
          s.Documento === student.Documento && 
          s['Nombre Completo'] === student['Nombre Completo']
        );
        
        // Agregar el turno seleccionado al estudiante
        return {
          ...student,
          Turno: newStudentsTurno[originalIndex] || ''
        };
      });
      
      // Verificar que todos los nuevos estudiantes tengan un turno asignado
      const studentsWithoutTurno = selectedNewStudentsArray.filter(student => !student.Turno);
      
      if (studentsWithoutTurno.length > 0) {
        setError(`Hay ${studentsWithoutTurno.length} estudiante(s) nuevo(s) sin turno asignado. Por favor, asigne un turno a todos los estudiantes antes de continuar.`);
        setLoading(false);
        return;
      }
      
      // Obtener los estudiantes reactivados seleccionados (si existen)
      const selectedReactivatedStudentsArray = changes.reactivatedStudents ? 
        changes.reactivatedStudents.filter((_, index) => 
          selectedReactivatedStudents[index]
        ) : [];
      
      console.log('Aplicando cambios SIPI...');
      console.log('Estudiantes seleccionados para actualizar:', updatedChangedStudents.length);
      console.log('Estudiantes seleccionados para inactivar:', selectedMissingStudentsArray.length);
      console.log('Estudiantes nuevos seleccionados:', selectedNewStudentsArray.length);
      console.log('Estudiantes reactivados seleccionados:', selectedReactivatedStudentsArray?.length);
      
      console.log('Datos a enviar:', {
        updatedChangedStudents: updatedChangedStudents.length,
        students: students.length,
        selectedMissingStudentsArray: selectedMissingStudentsArray.length,
        selectedNewStudentsArray: selectedNewStudentsArray.length,
        selectedReactivatedStudentsArray: selectedReactivatedStudentsArray?.length
      });
      
      const result = await DataService.applySIPIChanges(
        updatedChangedStudents, 
        students, 
        selectedMissingStudentsArray,
        selectedNewStudentsArray,
        selectedReactivatedStudentsArray
      );
      
      console.log('Resultado de aplicar cambios:', result);
      
      setSuccess(`Cambios aplicados correctamente. 
        Total revisados: ${result.stats.total} registros.
        Actualizados: ${result.stats.updated} registros.
        Nuevos: ${result.stats.new} registros.
        Inactivados: ${result.stats.markedInactive} registros.
        Sin cambios: ${result.stats.unchanged} registros.`);
      
      setShowConfirmation(false);
      setChanges(null);
      
      if (onFileProcessed) {
        onFileProcessed(result.updatedStudents);
      }
      
      setTimeout(() => {
        onHide();
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error al aplicar cambios SIPI:', err);
      setError(`Error al aplicar los cambios: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelChanges = () => {
    setShowConfirmation(false);
    setChanges(null);
  };
  
  const renderChangesTable = () => {
    if (!changes || !changes.changedStudents || changes.changedStudents.length === 0) {
      return <Alert variant="info">No se detectaron cambios en los datos de estudiantes existentes.</Alert>;
    }
    
    return (
      <div className="changes-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Campo</th>
              <th>Valor Actual</th>
              <th>Nuevo Valor</th>
              <th>Aplicar</th>
            </tr>
          </thead>
          <tbody>
            {changes.changedStudents.map((change, index) => (
              <React.Fragment key={index}>
                {Object.keys(change.changes).map((field, fieldIndex) => (
                  <tr key={`${index}-${fieldIndex}`}>
                    {fieldIndex === 0 ? (
                      <>
                        <td rowSpan={Object.keys(change.changes).length}>{change.student.Documento}</td>
                        <td rowSpan={Object.keys(change.changes).length}>{change.student['Nombre Completo']}</td>
                      </>
                    ) : null}
                    <td>{field}</td>
                    <td>{change.changes[field].oldValue}</td>
                    <td>{change.changes[field].newValue}</td>
                    <td>
                      <FormCheck 
                        type="checkbox"
                        checked={selectedChanges[index]?.[field] || false}
                        onChange={(e) => handleChangeSelection(index, field, e.target.checked)}
                        label=""
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
        <div className="mt-2">
          <FormCheck 
            type="checkbox"
            checked={Object.values(selectedChanges).every((studentChanges) => Object.values(studentChanges).every((isSelected) => isSelected))}
            onChange={(e) => handleSelectAllChanges(e.target.checked)}
            label="Seleccionar todos los cambios"
          />
        </div>
      </div>
    );
  };
  
  const renderMissingStudentsTable = () => {
    if (!changes || !changes.missingStudents || changes.missingStudents.length === 0) {
      return <Alert variant="info">Todos los estudiantes de tu base de datos aparecen en el archivo SIPI.</Alert>;
    }
    
    return (
      <div className="missing-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Estado</th>
              <th>Inactivar</th>
            </tr>
          </thead>
          <tbody>
            {changes.missingStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.Documento}</td>
                <td>{student['Nombre Completo']}</td>
                <td>{student.Codigo || 'No disponible'}</td>
                <td>{student.Estado || 'No especificado'}</td>
                <td>
                  <FormCheck 
                    type="checkbox"
                    checked={selectedMissingStudents[index] || false}
                    onChange={(e) => setSelectedMissingStudents(prev => ({ ...prev, [index]: e.target.checked }))}
                    label=""
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="mt-2">
          <FormCheck 
            type="checkbox"
            checked={Object.values(selectedMissingStudents).every((isSelected) => isSelected)}
            onChange={(e) => handleSelectAllMissing(e.target.checked)}
            label="Seleccionar todos los ausentes en SIPI"
          />
        </div>
      </div>
    );
  };

  const renderNewStudentsTable = () => {
    if (!changes || !changes.newStudents || changes.newStudents.length === 0) {
      return <Alert variant="info">No se detectaron estudiantes nuevos en el archivo SIPI.</Alert>;
    }
    
    return (
      <div className="new-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Estado</th>
              <th>Agregar</th>
              <th>Turno</th>
            </tr>
          </thead>
          <tbody>
            {changes.newStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.Documento}</td>
                <td>{student['Nombre Completo']}</td>
                <td>{student.Codigo || 'No disponible'}</td>
                <td>{student.Estado || 'No especificado'}</td>
                <td>
                  <FormCheck 
                    type="checkbox"
                    checked={selectedNewStudents[index] || false}
                    onChange={(e) => setSelectedNewStudents(prev => ({ ...prev, [index]: e.target.checked }))}
                    label=""
                  />
                </td>
                <td>
                  <Form.Select 
                    value={newStudentsTurno[index] || ''}
                    onChange={(e) => setNewStudentsTurno(prev => ({ ...prev, [index]: e.target.value }))}
                  >
                    <option value="">Seleccione un turno</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="mt-2">
          <FormCheck 
            type="checkbox"
            checked={Object.values(selectedNewStudents).every((isSelected) => isSelected)}
            onChange={(e) => handleSelectAllNew(e.target.checked)}
            label="Seleccionar todos los nuevos en SIPI"
          />
        </div>
      </div>
    );
  };

  const renderReactivatedStudentsTable = () => {
    if (!changes || !changes.reactivatedStudents || changes.reactivatedStudents.length === 0) {
      return <Alert variant="info">No se detectaron estudiantes reactivados en el archivo SIPI.</Alert>;
    }
    
    return (
      <div className="reactivated-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Estado</th>
              <th>Reactivar</th>
            </tr>
          </thead>
          <tbody>
            {changes.reactivatedStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.Documento}</td>
                <td>{student['Nombre Completo']}</td>
                <td>{student.Codigo || 'No disponible'}</td>
                <td>{student.Estado || 'No especificado'}</td>
                <td>
                  <FormCheck 
                    type="checkbox"
                    checked={selectedReactivatedStudents[index] || false}
                    onChange={(e) => setSelectedReactivatedStudents(prev => ({ ...prev, [index]: e.target.checked }))}
                    label=""
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="mt-2">
          <FormCheck 
            type="checkbox"
            checked={Object.values(selectedReactivatedStudents).every((isSelected) => isSelected)}
            onChange={(e) => handleSelectAllReactivated(e.target.checked)}
            label="Seleccionar todos los reactivados en SIPI"
          />
        </div>
      </div>
    );
  };

  const renderFilePreview = () => {
    if (!filePreview || !filePreview.data || filePreview.data.length === 0) {
      return <Alert variant="info">No se pudo generar una vista previa del archivo.</Alert>;
    }
    
    const importantColumns = {
      codigo: 0,         // Columna 1 (SIPI)
      nombre: 4,         // Columna 5 (Nombre completo)
      sexo: 8,           // Columna 9 (Sexo)
      documento: 15,     // Columna 16 (Documento)
      fechaNacimiento: 18 // Columna 19 (Fecha de nacimiento)
    };
    
    const columnNames = {
      0: "SIPI (Col 1)",
      4: "Nombre (Col 5)",
      8: "Sexo (Col 9)",
      15: "Documento (Col 16)",
      18: "Fecha Nac. (Col 19)"
    };
    
    return (
      <div className="file-preview-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Alert variant="info">
          Mostrando datos del rango {filePreview.range}. 
          Las columnas resaltadas son las que se utilizan para extraer los datos.
        </Alert>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>#</th>
              {filePreview.data[0].map((_, index) => (
                <th 
                  key={index} 
                  style={
                    Object.values(importantColumns).includes(index) 
                      ? { backgroundColor: '#e6f7ff', fontWeight: 'bold' } 
                      : {}
                  }
                >
                  {columnNames[index] || `Columna ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filePreview.data.slice(0, 10).map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowIndex}</td>
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    style={
                      Object.values(importantColumns).includes(cellIndex) 
                        ? { backgroundColor: '#e6f7ff' } 
                        : {}
                    }
                  >
                    {cell !== null && cell !== undefined ? cell.toString() : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered size={showConfirmation ? "lg" : "md"}>
      <Modal.Header closeButton>
        <Modal.Title>Cargar Archivo SIPI</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!showConfirmation ? (
          <>
            <p>
              Selecciona el archivo SIPI (.xls o .xlsx) para comparar con la base de datos actual.
              Se extraerán solo los datos relevantes y podrás revisar los cambios antes de aplicarlos.
            </p>
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Archivo SIPI</Form.Label>
                <Form.Control 
                  type="file" 
                  accept=".xls, .xlsx" 
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  El archivo debe tener extensión .xls o .xlsx y seguir el formato estándar de SIPI.
                </Form.Text>
              </Form.Group>
            </Form>
          </>
        ) : (
          <>
            <h5>Cambios detectados</h5>
            <p>
              Se han detectado los siguientes cambios en la base de datos.
              Revisa los cambios y confirma si deseas aplicarlos.
            </p>
            
            <Alert variant="info">
              <h5>Instrucciones:</h5>
              <p>Revisa los cambios detectados y selecciona cuáles quieres aplicar:</p>
              <ul>
                <li>En la pestaña <strong>Cambios</strong>: Marca o desmarca las casillas para actualizar datos de estudiantes existentes.</li>
                <li>En la pestaña <strong>Ausentes en SIPI</strong>: Selecciona qué estudiantes quieres marcar como inactivos.</li>
                <li>En la pestaña <strong>Nuevos en SIPI</strong>: Selecciona qué estudiantes nuevos quieres agregar a tu base de datos.</li>
                <li>En la pestaña <strong>Reactivados en SIPI</strong>: Selecciona qué estudiantes reactivados quieres agregar a tu base de datos.</li>
                <li>Los cambios no seleccionados NO se aplicarán a tu base de datos.</li>
              </ul>
            </Alert>
            
            <Tabs defaultActiveKey="changes" id="sipi-changes-tabs" className="mb-3">
              <Tab eventKey="changes" title={`Cambios (${changes?.changedStudents?.length || 0})`}>
                {renderChangesTable()}
              </Tab>
              <Tab eventKey="missing" title={`Ausentes en SIPI (${changes?.missingStudents?.length || 0})`}>
                <p>Estos estudiantes están en tu base de datos pero no aparecen en el archivo SIPI:</p>
                {renderMissingStudentsTable()}
              </Tab>
              <Tab eventKey="new" title={`Nuevos en SIPI (${changes?.newStudents?.length || 0})`}>
                <p>Estos estudiantes nuevos se detectaron en el archivo SIPI:</p>
                {renderNewStudentsTable()}
              </Tab>
              <Tab eventKey="reactivated" title={`Reactivados en SIPI (${changes?.reactivatedStudents?.length || 0})`}>
                <p>Estos estudiantes reactivados se detectaron en el archivo SIPI:</p>
                {renderReactivatedStudentsTable()}
              </Tab>
              <Tab eventKey="preview" title="Vista Previa del Archivo">
                <p>Vista previa de las primeras 10 filas del archivo SIPI:</p>
                {renderFilePreview()}
              </Tab>
            </Tabs>
            
            <div className="mt-3">
              <Alert variant="info">
                <strong>Nota:</strong> Solo se actualizarán los campos mostrados en la pestaña "Cambios". 
                Tus datos personalizados como día de piscina, turno y otros no se modificarán.
                Los estudiantes ausentes en SIPI se muestran solo para tu información.
              </Alert>
            </div>
          </>
        )}
        
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mt-3">
            {success}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {!showConfirmation ? (
          <>
            <Button 
              variant="secondary" 
              onClick={onHide} 
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Procesando...
                </>
              ) : (
                'Procesar Archivo'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="secondary" 
              onClick={handleCancelChanges} 
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="success" 
              onClick={handleConfirmChanges} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Aplicando cambios...
                </>
              ) : (
                'Aplicar Cambios'
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SIPIFileUploader;
