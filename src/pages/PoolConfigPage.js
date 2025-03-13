import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import PoolConfigService from '../services/PoolConfigService';

const PoolConfigPage = () => {
  // Días de la semana
  const weekdays = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' }
  ];

  // Estado para los días de piscina seleccionados
  const [selectedDays, setSelectedDays] = useState([]);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const loadPoolDays = () => {
      try {
        const poolDays = PoolConfigService.getPoolDays();
        setSelectedDays(poolDays.map(day => day.id));
      } catch (error) {
        console.error('Error al cargar los días de piscina:', error);
        setErrorMessage('No se pudieron cargar los días de piscina guardados.');
      }
    };

    loadPoolDays();
  }, []);

  // Manejar cambios en la selección de días
  const handleDayChange = (dayId) => {
    setSelectedDays(prevDays => {
      if (prevDays.includes(dayId)) {
        // Si ya está seleccionado, lo quitamos
        return prevDays.filter(id => id !== dayId);
      } else {
        // Si no está seleccionado, lo agregamos
        return [...prevDays, dayId];
      }
    });
    // Limpiar mensajes
    setSavedSuccessfully(false);
    setErrorMessage('');
  };

  // Guardar configuración
  const handleSave = () => {
    try {
      if (selectedDays.length === 0) {
        setErrorMessage('Debes seleccionar al menos un día de piscina.');
        return;
      }
      
      const success = PoolConfigService.savePoolDays(selectedDays);
      if (success) {
        setSavedSuccessfully(true);
        setErrorMessage('');
      } else {
        setErrorMessage('No se pudieron guardar los cambios. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al guardar los días de piscina:', error);
      setErrorMessage('No se pudieron guardar los cambios. Inténtalo de nuevo.');
    }
  };

  // Restablecer a valores predeterminados (lunes y jueves)
  const handleReset = () => {
    const defaultDays = [1, 4]; // Lunes y jueves
    setSelectedDays(defaultDays);
    setSavedSuccessfully(false);
    setErrorMessage('');
  };

  return (
    <Container>
      <h1 className="mb-4">Configuración de Días de Piscina</h1>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Selecciona los días de piscina</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">
            Selecciona los días de la semana en que los estudiantes asisten a la piscina. 
            Generalmente son 2 días, pero esto puede cambiar una vez al año.
          </p>
          
          {savedSuccessfully && (
            <Alert variant="success" onClose={() => setSavedSuccessfully(false)} dismissible>
              ¡Configuración guardada correctamente!
            </Alert>
          )}
          
          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
              {errorMessage}
            </Alert>
          )}
          
          <Form>
            <div className="d-flex flex-wrap gap-3 mb-4">
              {weekdays.map(day => (
                <Form.Check
                  key={day.id}
                  type="checkbox"
                  id={`day-${day.id}`}
                  label={day.name}
                  checked={selectedDays.includes(day.id)}
                  onChange={() => handleDayChange(day.id)}
                  className="me-3"
                />
              ))}
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleSave}
                className="d-flex align-items-center"
              >
                <FiSave className="me-2" /> Guardar configuración
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={handleReset}
                className="d-flex align-items-center"
              >
                <FiRefreshCw className="me-2" /> Restablecer valores predeterminados
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Información sobre días de piscina</h5>
        </Card.Header>
        <Card.Body>
          <p>
            Los días de piscina son importantes para la planificación de actividades en el centro educativo.
            En estos días, los estudiantes deben traer:
          </p>
          <ul>
            <li>Traje de baño</li>
            <li>Toalla</li>
            <li>Gorro de natación</li>
            <li>Sandalias</li>
            <li>Bolsa impermeable para la ropa mojada</li>
          </ul>
          <p className="mb-0">
            Esta configuración se utilizará para generar reportes y recordatorios relacionados con las actividades de piscina.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PoolConfigPage;
