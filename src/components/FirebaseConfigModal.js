import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import DataService from '../services/DataService';

const FirebaseConfigModal = ({ show, onHide }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [useFirebase, setUseFirebase] = useState(DataService.USE_FIREBASE);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // Cargar la configuración guardada al abrir el modal
  useEffect(() => {
    if (show) {
      // Intentar cargar la configuración guardada
      const savedConfig = localStorage.getItem('firebase_config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (error) {
          console.error('Error al cargar la configuración de Firebase:', error);
        }
      }
      
      // Cargar el estado de uso de Firebase
      setUseFirebase(DataService.USE_FIREBASE);
      
      // Resetear mensajes
      setIsSaved(false);
      setError('');
    }
  }, [show]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: value
    }));
  };

  // Manejar cambio en el switch de uso de Firebase
  const handleUseFirebaseChange = (e) => {
    setUseFirebase(e.target.checked);
  };

  // Guardar la configuración
  const handleSave = () => {
    try {
      // Validar que todos los campos estén completos si se va a usar Firebase
      if (useFirebase) {
        const missingFields = Object.entries(config)
          .filter(([_, value]) => !value)
          .map(([key, _]) => key);
        
        if (missingFields.length > 0) {
          setError(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
          return;
        }
      }
      
      // Guardar la configuración en localStorage
      localStorage.setItem('firebase_config', JSON.stringify(config));
      
      // Actualizar el flag de uso de Firebase en DataService usando el método apropiado
      DataService.setUseFirebase(useFirebase);
      
      // Mostrar mensaje de éxito
      setIsSaved(true);
      setError('');
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar la configuración de Firebase:', error);
      setError('Error al guardar la configuración. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Configuración de Firebase</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Check 
              type="switch"
              id="use-firebase-switch"
              label="Usar Firebase para almacenamiento de datos"
              checked={useFirebase}
              onChange={handleUseFirebaseChange}
            />
            <Form.Text className="text-muted">
              Activa esta opción para almacenar los datos en Firebase en lugar de localStorage.
            </Form.Text>
          </Form.Group>
          
          {useFirebase && (
            <>
              <Alert variant="info">
                Para configurar Firebase, necesitas crear un proyecto en la consola de Firebase y obtener las credenciales.
                <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="ms-2">
                  Ir a la consola de Firebase
                </a>
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control 
                  type="text" 
                  name="apiKey" 
                  value={config.apiKey} 
                  onChange={handleChange} 
                  placeholder="Ingresa tu API Key"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Auth Domain</Form.Label>
                <Form.Control 
                  type="text" 
                  name="authDomain" 
                  value={config.authDomain} 
                  onChange={handleChange} 
                  placeholder="proyecto-id.firebaseapp.com"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Project ID</Form.Label>
                <Form.Control 
                  type="text" 
                  name="projectId" 
                  value={config.projectId} 
                  onChange={handleChange} 
                  placeholder="proyecto-id"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Storage Bucket</Form.Label>
                <Form.Control 
                  type="text" 
                  name="storageBucket" 
                  value={config.storageBucket} 
                  onChange={handleChange} 
                  placeholder="proyecto-id.appspot.com"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Messaging Sender ID</Form.Label>
                <Form.Control 
                  type="text" 
                  name="messagingSenderId" 
                  value={config.messagingSenderId} 
                  onChange={handleChange} 
                  placeholder="123456789012"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>App ID</Form.Label>
                <Form.Control 
                  type="text" 
                  name="appId" 
                  value={config.appId} 
                  onChange={handleChange} 
                  placeholder="1:123456789012:web:abc123def456"
                />
              </Form.Group>
            </>
          )}
          
          {isSaved && <Alert variant="success">Configuración guardada correctamente.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FirebaseConfigModal;
