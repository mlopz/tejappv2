import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import StudentForm from '../components/StudentForm';
import DataService from '../services/DataService';

const EditStudentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Cargar los datos del estudiante al montar el componente
  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      try {
        const studentData = await DataService.getStudentById(id);
        console.log('Datos del estudiante cargados:', studentData);
        if (studentData) {
          setStudent(studentData);
        } else {
          setError('No se encontró el estudiante solicitado');
        }
      } catch (err) {
        console.error('Error al cargar estudiante:', err);
        setError(`Error al cargar los datos del estudiante: ${err.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadStudent();
    }
  }, [id]);
  
  // Función para manejar la actualización del estudiante
  const handleUpdateStudent = async (updatedData) => {
    setSaving(true);
    setError(null);
    
    try {
      // Llamar al servicio para actualizar el estudiante
      const result = await DataService.updateStudent(id, updatedData);
      
      if (result) {
        setSuccess(true);
        // Redirigir a la página de estudiantes después de un breve retraso
        setTimeout(() => {
          navigate('/students');
        }, 2000);
      } else {
        setError('Error al actualizar el estudiante. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error al actualizar estudiante:', err);
      setError(`Error al actualizar el estudiante: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Función para cancelar la edición y volver a la lista
  const handleCancel = () => {
    navigate('/students');
  };
  
  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h1>Editar Estudiante</h1>
          <p>Modifica la información del estudiante según sea necesario.</p>
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger">
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      {success && (
        <Row className="mb-3">
          <Col>
            <Alert variant="success">
              Estudiante actualizado exitosamente. Redirigiendo a la lista de estudiantes...
            </Alert>
          </Col>
        </Row>
      )}
      
      {loading ? (
        <Row className="mb-3">
          <Col className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-2">Cargando datos del estudiante...</p>
          </Col>
        </Row>
      ) : student ? (
        <Row>
          <Col>
            <StudentForm 
              student={student}
              initialData={student}
              onSubmit={handleUpdateStudent} 
              onCancel={handleCancel}
              isEditing={true}
            />
          </Col>
        </Row>
      ) : (
        <Row className="mb-3">
          <Col>
            <Alert variant="warning">
              No se encontró el estudiante solicitado o ha ocurrido un error al cargar los datos.
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default EditStudentPage;
