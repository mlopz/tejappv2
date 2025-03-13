import React, { useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import StudentForm from '../components/StudentForm';
import DataService from '../services/DataService'; // Asegúrate de importar correctamente el servicio

const AddStudentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Función para manejar la creación de un nuevo sujeto
  const handleAddStudent = async (studentData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Llamar al servicio para agregar el sujeto
      const result = await DataService.addStudent(studentData);
      
      if (result && result.id) {
        setSuccess(true);
        // Redirigir a la página de sujetos después de un breve retraso
        setTimeout(() => {
          navigate('/students');
        }, 2000);
      } else {
        setError('Error al crear el sujeto. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error al agregar sujeto:', err);
      setError(`Error al crear el sujeto: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cancelar la creación y volver a la lista
  const handleCancel = () => {
    navigate('/students');
  };
  
  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h1>Agregar Nuevo Sujeto</h1>
          <p>Completa el formulario para agregar un nuevo sujeto al sistema.</p>
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
              Sujeto creado exitosamente. Redirigiendo a la lista de sujetos...
            </Alert>
          </Col>
        </Row>
      )}
      
      <Row>
        <Col>
          <StudentForm 
            onSubmit={handleAddStudent} 
            onCancel={handleCancel}
            isEditing={false}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default AddStudentPage;
