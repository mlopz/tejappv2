import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Tabs, Tab, Alert, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DataService from '../services/DataService';
import { generateUniqueKeyForItem } from '../utils/uniqueKeyGenerator';

const MissingDocumentationPage = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        setLoading(true);
        const data = await DataService.getStudents();
        // Filtrar solo estudiantes activos
        const activeEstudiantes = data.filter(estudiante => estudiante.Activo !== false);
        setEstudiantes(activeEstudiantes);
      } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        setError('No se pudieron cargar los estudiantes. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadEstudiantes();
  }, []);

  // Función para obtener estudiantes con aptitud física faltante
  const getEstudiantesWithMissingAptitud = () => {
    return estudiantes.filter(estudiante => !estudiante.aptitudFisicaDate);
  };
  
  // Función para obtener estudiantes con vacunas faltantes
  const getEstudiantesWithMissingVacunas = () => {
    return estudiantes.filter(estudiante => !estudiante.vacunasDate);
  };
  
  // Función para obtener estudiantes con PAI faltante
  const getEstudiantesWithMissingPAI = () => {
    return estudiantes.filter(estudiante => !estudiante.paiDate);
  };

  // Función para navegar a la página de detalles del estudiante
  const handleViewEstudiante = (estudianteId) => {
    navigate(`/estudiantes/${estudianteId}`);
  };

  // Renderizar tabla de estudiantes con documentación faltante
  const renderEstudiantesTable = (estudiantesArray) => {
    if (estudiantesArray.length === 0) {
      return <Alert variant="success">No hay estudiantes con esta documentación faltante.</Alert>;
    }

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nombre</th>
            <th>Turno</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {estudiantesArray.map((estudiante, index) => (
            <tr key={generateUniqueKeyForItem(estudiante, index, 'missing-doc-student')}>
              <td>{estudiante.Documento || 'N/A'}</td>
              <td>{estudiante['Nombre Completo'] || 'N/A'}</td>
              <td>
                <Badge bg={estudiante.Turno === 'Matutino' ? 'info' : 'warning'}>
                  {estudiante.Turno || 'Sin asignar'}
                </Badge>
              </td>
              <td>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => handleViewEstudiante(estudiante.id)}
                >
                  Ver Detalles
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <p className="mt-3">Cargando datos...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Estudiantes con Documentación Faltante</h2>
          <p>Aquí puedes ver los estudiantes que tienen documentación pendiente de entrega.</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="aptitudFisica" className="mb-3">
                <Tab eventKey="aptitudFisica" title={`Aptitud Física (${getEstudiantesWithMissingAptitud().length})`}>
                  <Card.Title className="mb-3">Estudiantes sin Certificado de Aptitud Física</Card.Title>
                  {renderEstudiantesTable(getEstudiantesWithMissingAptitud())}
                </Tab>
                <Tab eventKey="vacunas" title={`Vacunas (${getEstudiantesWithMissingVacunas().length})`}>
                  <Card.Title className="mb-3">Estudiantes sin Certificado de Vacunas</Card.Title>
                  {renderEstudiantesTable(getEstudiantesWithMissingVacunas())}
                </Tab>
                <Tab eventKey="pai" title={`PAI (${getEstudiantesWithMissingPAI().length})`}>
                  <Card.Title className="mb-3">Estudiantes sin Certificado PAI</Card.Title>
                  {renderEstudiantesTable(getEstudiantesWithMissingPAI())}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MissingDocumentationPage;
