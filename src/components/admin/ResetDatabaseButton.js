import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { resetDatabase } from '../../utils/resetDatabase';

/**
 * Componente que proporciona un botón para reiniciar la base de datos con datos de prueba
 */
const ResetDatabaseButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const showModal = () => {
    setIsModalVisible(true);
    setResult(null); // Limpiar resultados anteriores
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    // Limpiar el resultado después de cerrar el modal
    setTimeout(() => {
      setResult(null);
    }, 300);
  };

  const handleReset = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const resetResult = await resetDatabase();
      setResult(resetResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Error inesperado: ${error.toString()}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="danger" 
        onClick={showModal}
        className="d-flex align-items-center justify-content-center gap-2"
      >
        <i className="bi bi-arrow-repeat"></i>
        Reiniciar Base de Datos
      </Button>

      <Modal
        show={isModalVisible}
        onHide={handleCancel}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Reiniciar Base de Datos</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {!result ? (
            isLoading ? (
              <div className="text-center p-4">
                <Spinner animation="border" role="status" variant="primary" />
                <p className="mt-3">Reiniciando base de datos...</p>
              </div>
            ) : (
              <>
                <Alert variant="warning">
                  <strong>¡Atención!</strong> Esta acción eliminará todos los datos existentes y los reemplazará con datos de prueba.
                </Alert>
                <p>Esta operación no se puede deshacer. ¿Está seguro de que desea continuar?</p>
              </>
            )
          ) : (
            <Alert variant={result.success ? "success" : "danger"}>
              <Alert.Heading>{result.success ? "Operación Exitosa" : "Error"}</Alert.Heading>
              <p>{result.message}</p>
            </Alert>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          
          {!result && !isLoading && (
            <Button 
              variant="danger" 
              onClick={handleReset}
            >
              Confirmar Reinicio
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ResetDatabaseButton;
