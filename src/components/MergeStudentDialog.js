import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Row, Col } from 'react-bootstrap';

/**
 * Componente de diálogo para resolver conflictos de fusión de sujetos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Controla si el diálogo está visible
 * @param {Function} props.onHide - Función para cerrar el diálogo
 * @param {Object} props.inactiveSujeto - Datos del sujeto inactivo
 * @param {Object} props.existingSujeto - Datos del sujeto activo existente
 * @param {Function} props.onMergeDecision - Función para manejar la decisión de fusión
 */
const MergeStudentDialog = ({ 
  show, 
  onHide, 
  inactiveSujeto = {}, 
  existingSujeto = {},
  onMergeDecision
}) => {
  // Estado para la estrategia de fusión general
  const [mergeStrategy, setMergeStrategy] = useState('keepActive');
  
  // Estado para almacenar las selecciones por campo (true = usar datos del sujeto inactivo)
  const [fieldSelections, setFieldSelections] = useState({});
  
  // Estado para controlar si se está usando la selección personalizada
  const [useCustomSelection, setUseCustomSelection] = useState(false);

  // Campos relevantes para mostrar en la comparación
  const fieldsToCompare = [
    { key: 'Nombre Completo', label: 'Nombre Completo' },
    { key: 'Documento', label: 'Documento' },
    { key: 'FechaNacimiento', label: 'Fecha de Nacimiento' },
    { key: 'Sexo', label: 'Sexo' },
    { key: 'Codigo', label: 'Código' },
    { key: 'Direccion', label: 'Dirección' },
    { key: 'Telefono', label: 'Teléfono' },
    { key: 'Email', label: 'Email' }
  ];
  
  // Inicializar las selecciones de campos cuando cambian los sujetos
  useEffect(() => {
    if (inactiveSujeto && existingSujeto) {
      const initialSelections = {};
      fieldsToCompare.forEach(field => {
        // Por defecto, usar los datos del sujeto activo (false = activo, true = inactivo)
        initialSelections[field.key] = false;
      });
      setFieldSelections(initialSelections);
    }
  }, [inactiveSujeto, existingSujeto]);

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Formatear valor para mostrar
  const formatValue = (key, value) => {
    if (value === undefined || value === null) return 'N/A';
    if (value === '') return 'N/A';
    
    if (key === 'FechaNacimiento') {
      return formatDate(value);
    }
    
    return String(value);
  };
  
  // Seleccionar todos los campos para usar datos del sujeto activo
  const selectAllActive = () => {
    const newSelections = {};
    fieldsToCompare.forEach(field => {
      newSelections[field.key] = false;
    });
    setFieldSelections(newSelections);
  };
  
  // Seleccionar todos los campos para usar datos del sujeto inactivo
  const selectAllInactive = () => {
    const newSelections = {};
    fieldsToCompare.forEach(field => {
      newSelections[field.key] = true;
    });
    setFieldSelections(newSelections);
  };
  
  // Cambiar la selección de un campo específico
  const handleFieldSelectionChange = (fieldKey, useInactiveData) => {
    setFieldSelections(prev => ({
      ...prev,
      [fieldKey]: useInactiveData
    }));
  };

  // Manejar el cambio de estrategia de fusión
  const handleStrategyChange = (strategy) => {
    setMergeStrategy(strategy);
    setUseCustomSelection(strategy === 'custom');
    
    // Actualizar las selecciones de campos según la estrategia
    if (strategy === 'keepActive') {
      selectAllActive();
    } else if (strategy === 'keepInactive') {
      selectAllInactive();
    } else if (strategy === 'merge') {
      // Para la estrategia de fusión, preferir campos no vacíos del inactivo
      const newSelections = {};
      fieldsToCompare.forEach(field => {
        const inactiveValue = inactiveSujeto[field.key];
        const isInactiveValueValid = inactiveValue !== undefined && 
                                    inactiveValue !== null && 
                                    inactiveValue !== '';
        newSelections[field.key] = isInactiveValueValid;
      });
      setFieldSelections(newSelections);
    }
  };

  // Manejar la decisión de fusión
  const handleMergeDecision = () => {
    if (typeof onMergeDecision === 'function') {
      if (useCustomSelection) {
        // Crear un objeto con los datos seleccionados campo por campo
        const mergedData = {};
        fieldsToCompare.forEach(field => {
          const useInactiveData = fieldSelections[field.key];
          mergedData[field.key] = useInactiveData 
            ? inactiveSujeto[field.key] 
            : existingSujeto[field.key];
        });
        
        // Pasar la estrategia personalizada y los datos fusionados
        onMergeDecision('custom', mergedData);
      } else {
        // Usar la estrategia general seleccionada
        onMergeDecision(mergeStrategy);
      }
    }
  };

  // Verificar que tengamos datos válidos para mostrar
  const hasValidData = inactiveSujeto && existingSujeto && 
                      typeof inactiveSujeto === 'object' && 
                      typeof existingSujeto === 'object';

  if (!hasValidData) {
    console.error('Datos de sujetos inválidos:', { inactiveSujeto, existingSujeto });
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Sujeto Duplicado Detectado</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Se ha detectado que ya existe un sujeto activo con el mismo nombre.
          Por favor, elige qué datos deseas conservar:
        </p>

        <Form>
          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id="keepActive"
              name="mergeStrategy"
              label="Mantener todos los datos del sujeto activo"
              value="keepActive"
              checked={mergeStrategy === 'keepActive'}
              onChange={(e) => handleStrategyChange(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="keepInactive"
              name="mergeStrategy"
              label="Mantener todos los datos del sujeto inactivo"
              value="keepInactive"
              checked={mergeStrategy === 'keepInactive'}
              onChange={(e) => handleStrategyChange(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="merge"
              name="mergeStrategy"
              label="Fusionar datos (los campos no vacíos del inactivo tienen prioridad)"
              value="merge"
              checked={mergeStrategy === 'merge'}
              onChange={(e) => handleStrategyChange(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="custom"
              name="mergeStrategy"
              label="Selección personalizada (elige campo por campo)"
              value="custom"
              checked={mergeStrategy === 'custom'}
              onChange={(e) => handleStrategyChange(e.target.value)}
            />
          </Form.Group>
        </Form>

        <h5 className="mt-4">Comparación de datos:</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Sujeto Activo</th>
              <th>Sujeto Inactivo</th>
              {mergeStrategy === 'custom' && <th>Selección</th>}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(fieldsToCompare) && fieldsToCompare.map((field) => (
              <tr key={field.key}>
                <td>{field.label}</td>
                <td>{formatValue(field.key, existingSujeto[field.key])}</td>
                <td>{formatValue(field.key, inactiveSujeto[field.key])}</td>
                {mergeStrategy === 'custom' && (
                  <td>
                    <Form.Group as={Row} className="mb-0">
                      <Col>
                        <Form.Check
                          type="radio"
                          name={`field-${field.key}`}
                          id={`active-${field.key}`}
                          label="Activo"
                          checked={!fieldSelections[field.key]}
                          onChange={() => handleFieldSelectionChange(field.key, false)}
                        />
                      </Col>
                      <Col>
                        <Form.Check
                          type="radio"
                          name={`field-${field.key}`}
                          id={`inactive-${field.key}`}
                          label="Inactivo"
                          checked={fieldSelections[field.key]}
                          onChange={() => handleFieldSelectionChange(field.key, true)}
                        />
                      </Col>
                    </Form.Group>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleMergeDecision}>
          Aplicar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MergeStudentDialog;
