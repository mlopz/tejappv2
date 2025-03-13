import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import StudentDetails from '../components/StudentDetails';
import DataService from '../services/DataService';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estudiante, setEstudiante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar los datos del estudiante al montar el componente
  useEffect(() => {
    const loadEstudiante = async () => {
      setLoading(true);
      try {
        const estudianteData = await DataService.getStudentById(id);
        if (estudianteData) {
          setEstudiante(estudianteData);
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
      loadEstudiante();
    }
  }, [id]);
  
  // Función para manejar la edición del estudiante
  const handleEdit = (estudianteId) => {
    navigate(`/students/edit/${estudianteId}`);
  };
  
  // Función para manejar la eliminación del estudiante
  const handleDelete = async (estudianteId) => {
    try {
      await DataService.deleteStudent(estudianteId);
      // Redirigir a la lista de estudiantes después de eliminar
      navigate('/students');
    } catch (err) {
      console.error('Error al eliminar estudiante:', err);
      setError(`Error al eliminar el estudiante: ${err.message || 'Error desconocido'}`);
    }
  };
  
  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h1>Detalles del Estudiante</h1>
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
      
      {loading ? (
        <Row className="mb-3">
          <Col className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-2">Cargando datos del estudiante...</p>
          </Col>
        </Row>
      ) : estudiante ? (
        <Row>
          <Col>
            <StudentDetails 
              student={estudiante}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
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

export default StudentDetailPage;
