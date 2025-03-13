import React from 'react';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const StudentDetails = ({ student }) => {
  const navigate = useNavigate();

  if (!student) {
    return <div>No se encontró información del sujeto</div>;
  }

  // Función para determinar si una fecha está próxima a vencer (menos de 30 días)
  const isDateNearExpiration = (dateStr) => {
    if (!dateStr) return false;
    
    // Convertir la fecha del formato DD/MM/YYYY a un objeto Date
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0 a 11
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    
    // Calcular la diferencia en días
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para determinar si una fecha está vencida
  const isDateExpired = (dateStr) => {
    if (!dateStr) return false;
    
    // Convertir la fecha del formato DD/MM/YYYY a un objeto Date
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0 a 11
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    
    return date < today;
  };

  // Función para obtener el color de la badge según el estado de la fecha
  const getStatusBadge = (dateStr, label) => {
    if (!dateStr) return <Badge bg="secondary">{label}: No disponible</Badge>;
    
    if (isDateExpired(dateStr)) {
      return <Badge bg="danger">{label}: {dateStr} (Vencido)</Badge>;
    } else if (isDateNearExpiration(dateStr)) {
      return <Badge bg="warning" text="dark">{label}: {dateStr} (Próximo a vencer)</Badge>;
    } else {
      return <Badge bg="success">{label}: {dateStr} (Vigente)</Badge>;
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Ficha del Sujeto</h4>
          <Button variant="light" size="sm" onClick={() => navigate('/students')}>
            Volver a la lista
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col md={6}>
            <h2>{student['Nombre Completo']}</h2>
            <p className="text-muted">Documento: {student.Documento}</p>
          </Col>
          <Col md={6} className="text-md-end">
            <Badge bg={student.Turno === 'Matutino' ? 'info' : 'warning'} className="me-2">
              {student.Turno}
            </Badge>
            <Badge bg={student.Sexo === 'M' ? 'pink' : 'primary'}>
              {student.Sexo === 'M' ? 'Mujer' : 'Varón'}
            </Badge>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>Información Personal</Card.Header>
              <Card.Body>
                <p><strong>Edad:</strong> {student.Edad} años</p>
                <p><strong>Fecha de Nacimiento:</strong> {student['Fecha de nacimiento']}</p>
                <p><strong>Familia:</strong> {student.Familia || 'No registrado'}</p>
                <p><strong>SIPI:</strong> {student.Sipi}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>Documentación</Card.Header>
              <Card.Body>
                <p><strong>Fecha Documento:</strong> {student['Fecha Documento'] || 'No registrado'}</p>
                <div className="mb-2">
                  {getStatusBadge(student['Aptitud Fisica'], 'Aptitud Física')}
                </div>
                <div className="mb-2">
                  {getStatusBadge(student.Vacunas, 'Vacunas')}
                </div>
                <div className="mb-2">
                  {getStatusBadge(student.PAI, 'PAI')}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Card>
              <Card.Header>Información Adicional</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <p><strong>AFAM:</strong> {student.AFAM || 'No registrado'}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Fonasa:</strong> {student.Fonasa || 'No registrado'}</p>
                  </Col>
                  <Col md={4}>
                    <p><strong>Día de Piscina:</strong> {student['Dia de Piscina'] || 'No asignado'}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-end gap-2">
          <Button 
            variant="outline-primary" 
            onClick={() => navigate(`/edit-student/${student.Documento}`)}
          >
            Editar Información
          </Button>
          <Button 
            variant="outline-success" 
            onClick={() => window.print()}
          >
            Imprimir Ficha
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default StudentDetails;
