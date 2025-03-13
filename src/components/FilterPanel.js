import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Button, Card, Collapse } from 'react-bootstrap';
import PoolConfigService from '../services/PoolConfigService';

const FilterPanel = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    Documento: '',
    'Nombre Completo': '',
    Turno: '',
    Sexo: '',
    'Dia de Piscina': '',
    AFAM: '',
    Fonasa: '',
    Activo: true // Por defecto, solo mostrar estudiantes activos
  });
  const [open, setOpen] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [poolDays, setPoolDays] = useState([]);
  
  // Referencia para almacenar la última versión de los filtros
  const filtersRef = useRef(filters);

  // Cargar los días de piscina configurados
  useEffect(() => {
    const loadPoolDays = () => {
      const configuredDays = PoolConfigService.getPoolDays();
      setPoolDays(configuredDays);
    };
    
    loadPoolDays();
    
    // Agregar un event listener para actualizar los días de piscina cuando cambie la configuración
    window.addEventListener('storage', loadPoolDays);
    
    return () => {
      window.removeEventListener('storage', loadPoolDays);
    };
  }, []);

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    // Solo aplicamos filtros si han cambiado realmente
    if (JSON.stringify(filtersRef.current) !== JSON.stringify(filters)) {
      // Aplicar filtros automáticamente
      onFilter(filters);
      filtersRef.current = filters;
    }
  }, [filters, onFilter]);

  // Manejamos los cambios en los campos de filtro con debounce
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para el campo Documento, solo permitir números
    if (name === 'Documento' && !/^\d*$/.test(value)) {
      return; // No actualizar si contiene caracteres no numéricos
    }
    
    // Cancelar el timeout anterior si existe
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Establecer un nuevo timeout para actualizar los filtros después de un breve retraso
    const timeout = setTimeout(() => {
      setFilters(prevFilters => ({
        ...prevFilters,
        [name]: value
      }));
    }, 300); // 300ms de retraso para evitar demasiadas actualizaciones
    
    setTypingTimeout(timeout);
  };

  // Limpiamos todos los filtros
  const handleClear = () => {
    setFilters({
      Documento: '',
      'Nombre Completo': '',
      Turno: '',
      Sexo: '',
      'Dia de Piscina': '',
      AFAM: '',
      Fonasa: '',
      Activo: true
    });
  };

  // Filtros rápidos para los campos más comunes
  const quickFilters = (
    <Row className="mb-2">
      <Col md={4}>
        <Form.Group controlId="filterDocumento">
          <Form.Control
            type="text"
            name="Documento"
            defaultValue={filters.Documento}
            onChange={handleChange}
            placeholder="Buscar por documento (solo números)"
            size="sm"
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group controlId="filterNombre">
          <Form.Control
            type="text"
            name="Nombre Completo"
            defaultValue={filters['Nombre Completo']}
            onChange={handleChange}
            placeholder="Buscar por nombre"
            size="sm"
          />
        </Form.Group>
      </Col>
      <Col md={4}>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" size="sm" onClick={handleClear} className="flex-grow-1">
            Limpiar
          </Button>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => setOpen(!open)}
            aria-controls="advanced-filters"
            aria-expanded={open}
          >
            {open ? 'Menos filtros' : 'Más filtros'}
          </Button>
        </div>
      </Col>
    </Row>
  );

  // Filtros avanzados que se muestran al expandir
  const advancedFilters = (
    <Collapse in={open}>
      <div id="advanced-filters">
        <Row className="mb-2">
          <Col md={3}>
            <Form.Group controlId="filterTurno">
              <Form.Label className="small mb-1">Turno</Form.Label>
              <Form.Select
                name="Turno"
                defaultValue={filters.Turno}
                onChange={handleChange}
                size="sm"
              >
                <option value="">Todos</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="filterSexo">
              <Form.Label className="small mb-1">Sexo</Form.Label>
              <Form.Select
                name="Sexo"
                defaultValue={filters.Sexo}
                onChange={handleChange}
                size="sm"
              >
                <option value="">Todos</option>
                <option value="M">Mujer</option>
                <option value="V">Varón</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="filterDiaPiscina">
              <Form.Label className="small mb-1">Día de Piscina</Form.Label>
              <Form.Select
                name="Dia de Piscina"
                defaultValue={filters['Dia de Piscina']}
                onChange={handleChange}
                size="sm"
              >
                <option value="">Todos</option>
                {poolDays.map(day => (
                  <option key={day.id} value={day.name}>{day.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Row>
              <Col md={6}>
                <Form.Group controlId="filterAFAM">
                  <Form.Label className="small mb-1">AFAM</Form.Label>
                  <Form.Select
                    name="AFAM"
                    defaultValue={filters.AFAM}
                    onChange={handleChange}
                    size="sm"
                  >
                    <option value="">Todos</option>
                    <option value="Si">Sí</option>
                    <option value="No">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="filterFonasa">
                  <Form.Label className="small mb-1">Fonasa</Form.Label>
                  <Form.Select
                    name="Fonasa"
                    defaultValue={filters.Fonasa}
                    onChange={handleChange}
                    size="sm"
                  >
                    <option value="">Todos</option>
                    <option value="Si">Sí</option>
                    <option value="No">No</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="mb-2">
          <Col md={12}>
            <Form.Group controlId="filterActivo">
              <Form.Check 
                type="switch"
                id="custom-switch"
                label="Mostrar solo estudiantes activos"
                name="Activo"
                checked={filters.Activo}
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    Activo: e.target.checked
                  });
                }}
              />
              <Form.Text className="text-muted">
                Los estudiantes inactivos son aquellos que no aparecen en el último archivo SIPI procesado.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </div>
    </Collapse>
  );

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Form>
          {quickFilters}
          {advancedFilters}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FilterPanel;
