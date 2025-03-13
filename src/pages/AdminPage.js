import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FiDatabase, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ResetDatabaseButton from '../components/admin/ResetDatabaseButton';

/**
 * Página de administración que proporciona herramientas para gestionar la aplicación
 */
const AdminPage = () => {
  const [message, setMessage] = useState(null);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Administración</h1>
            <Link to="/" className="btn btn-outline-primary">
              <FiArrowLeft /> Volver al inicio
            </Link>
          </div>
        </Col>
      </Row>

      {message && (
        <Row className="mb-4">
          <Col>
            <Alert 
              variant={message.type} 
              onClose={() => setMessage(null)} 
              dismissible
            >
              {message.text}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Base de Datos</h5>
            </Card.Header>
            <Card.Body>
              <p>
                Desde aquí puede reiniciar la base de datos con datos de prueba. 
                Esta acción eliminará todos los datos existentes y los reemplazará con datos nuevos.
              </p>
              <div className="d-grid gap-2">
                <ResetDatabaseButton />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Solución de Problemas</h5>
            </Card.Header>
            <Card.Body>
              <p>
                Si está experimentando problemas con claves duplicadas u otros errores, 
                reiniciar la base de datos puede ayudar a resolverlos.
              </p>
              <p>
                La nueva implementación utiliza un generador de claves únicas que combina:
              </p>
              <ul>
                <li>Identificador del elemento (documento, ID)</li>
                <li>Índice en la lista</li>
                <li>Timestamp actual</li>
                <li>Valor aleatorio</li>
              </ul>
              <p>
                Esto garantiza que todas las claves sean únicas en toda la aplicación.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPage;
