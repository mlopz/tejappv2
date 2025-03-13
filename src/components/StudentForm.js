import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Modal, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PoolConfigService from '../services/PoolConfigService';
import FamiliaService from '../services/FamiliaService';

const StudentForm = ({ student, initialData, onSubmit, isEditing }) => {
  const [formData, setFormData] = useState({
    Documento: '',
    Familia: '',
    Apellido: '',
    'Nombre Completo': '',
    Nombre: '',
    Sexo: '',
    Edad: '',
    'Fecha de nacimiento': '',
    Sipi: '',
    Turno: '',
    'Fecha Documento': '',
    'Aptitud Fisica': '',
    Vacunas: '',
    AFAM: '',
    PAI: '',
    Fonasa: '',
    'Dia de Piscina': '',
    Activo: 'Si'  // Valor por defecto
  });

  // Estado para los modales de confirmación
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [showSipiModal, setShowSipiModal] = useState(false);
  const [tempDocumento, setTempDocumento] = useState('');
  const [tempSipi, setTempSipi] = useState('');
  
  // Estado para las fechas
  const [birthDate, setBirthDate] = useState(null);
  const [documentDate, setDocumentDate] = useState(null);
  const [aptitudDate, setAptitudDate] = useState(null);
  const [vacunasDate, setVacunasDate] = useState(null);
  const [paiDate, setPaiDate] = useState(null);
  
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('personal');
  
  // Estado para los días de piscina disponibles
  const [poolDays, setPoolDays] = useState([]);
  
  // Estado para las familias disponibles
  const [familias, setFamilias] = useState([]);
  const [loadingFamilias, setLoadingFamilias] = useState(false);

  // Cargar los días de piscina configurados
  useEffect(() => {
    const loadPoolDays = () => {
      const days = PoolConfigService.getPoolDays();
      setPoolDays(days);
    };
    
    loadPoolDays();
    
    // Escuchar cambios en la configuración de días de piscina
    window.addEventListener('poolDaysUpdated', loadPoolDays);
    
    return () => {
      window.removeEventListener('poolDaysUpdated', loadPoolDays);
    };
  }, []);

  // Cargar las familias disponibles
  useEffect(() => {
    const cargarFamilias = async () => {
      setLoadingFamilias(true);
      try {
        const familiasList = await FamiliaService.loadFamilias({ soloActivas: true });
        setFamilias(familiasList);
      } catch (error) {
        console.error('Error al cargar familias:', error);
      } finally {
        setLoadingFamilias(false);
      }
    };
    
    cargarFamilias();
  }, []);

  // Actualizamos el formulario cuando se recibe un estudiante para editar
  useEffect(() => {
    if (student || initialData) {
      const data = student || initialData;
      setFormData(data);
      
      // Convertir fechas de string a objetos Date
      if (data['Fecha de nacimiento']) {
        const [day, month, year] = data['Fecha de nacimiento'].split('/');
        if (day && month && year) {
          setBirthDate(new Date(year, month - 1, day));
        }
      }
      
      if (data['Fecha Documento']) {
        const [day, month, year] = data['Fecha Documento'].split('/');
        if (day && month && year) {
          setDocumentDate(new Date(year, month - 1, day));
        }
      }
      
      if (data['Aptitud Fisica']) {
        const [day, month, year] = data['Aptitud Fisica'].split('/');
        if (day && month && year) {
          setAptitudDate(new Date(year, month - 1, day));
        }
      }
      
      if (data.Vacunas) {
        const [day, month, year] = data.Vacunas.split('/');
        if (day && month && year) {
          setVacunasDate(new Date(year, month - 1, day));
        }
      }
      
      if (data.PAI) {
        const [day, month, year] = data.PAI.split('/');
        if (day && month && year) {
          setPaiDate(new Date(year, month - 1, day));
        }
      }
      
      // Si estamos editando, inicializamos los valores temporales
      if (isEditing) {
        setTempDocumento(data.Documento || '');
        setTempSipi(data.Sipi || '');
      }
    }
  }, [student, initialData, isEditing]);

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  // Efecto para actualizar la edad cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (birthDate) {
      const age = calculateAge(birthDate);
      setFormData(prevData => ({
        ...prevData,
        Edad: age
      }));
    }
  }, [birthDate]);

  // Manejamos los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si estamos editando y el campo es Documento o Sipi, mostramos el modal de confirmación
    if (isEditing && name === 'Documento') {
      setTempDocumento(value || '');
      setShowDocumentoModal(true);
      return;
    }
    
    if (isEditing && name === 'Sipi') {
      setTempSipi(value || '');
      setShowSipiModal(true);
      return;
    }
    
    // Si el campo es Nombre Completo, extraer nombre y apellido
    if (name === 'Nombre Completo') {
      const nombreCompleto = (value || '').trim();
      
      // Intentar dividir el nombre completo en partes
      const partes = nombreCompleto.split(' ').filter(part => part.trim() !== '');
      
      if (partes.length >= 2) {
        // Para el caso común de un nombre y dos apellidos (o más)
        // Asumimos que el primer elemento es el nombre
        const nombre = partes[0];
        
        // El resto son los apellidos
        const apellidos = partes.slice(1).join(' ');
        
        // Actualizar los campos correspondientes
        setFormData(prevData => ({
          ...prevData,
          [name]: value || '',
          'Nombre': nombre,
          'Apellido': apellidos
        }));
        
        return;
      } else if (partes.length === 1) {
        // Si solo hay una palabra, la ponemos como nombre y dejamos apellido vacío
        setFormData(prevData => ({
          ...prevData,
          [name]: value || '',
          'Nombre': partes[0],
          'Apellido': ''
        }));
        
        return;
      }
    }
    
    // Si el campo es Nombre o Apellido, actualizar el Nombre Completo
    if (name === 'Nombre' || name === 'Apellido') {
      setFormData(prevData => {
        // Obtener el valor actual del otro campo (Nombre o Apellido)
        const otherFieldValue = name === 'Nombre' 
          ? (prevData.Apellido || '') 
          : (prevData.Nombre || '');
        
        // Obtener el valor actual del campo que se está modificando
        const currentFieldValue = value || '';
        
        // Construir el nuevo nombre completo
        let nuevoNombreCompleto = '';
        
        if (name === 'Nombre') {
          // Si estamos modificando el Nombre, el formato es "Nombre Apellido"
          nuevoNombreCompleto = `${currentFieldValue} ${otherFieldValue}`.trim();
        } else {
          // Si estamos modificando el Apellido, el formato es "Nombre Apellido"
          nuevoNombreCompleto = `${otherFieldValue} ${currentFieldValue}`.trim();
        }
        
        // Actualizar el estado con el nuevo nombre completo
        return {
          ...prevData,
          [name]: value || '',
          'Nombre Completo': nuevoNombreCompleto
        };
      });
      
      return;
    }
    
    // Para cualquier otro campo, actualizar normalmente
    setFormData(prevData => ({
      ...prevData,
      [name]: value || '' // Asegurarse de que nunca sea undefined
    }));
  };

  // Manejador para cambios en los DatePickers
  const handleDateChange = (date, field) => {
    if (!date) return;
    
    // Formatear la fecha como DD/MM/YYYY
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    // Actualizar el estado correspondiente
    switch (field) {
      case 'birthDate':
        setBirthDate(date);
        setFormData(prevData => ({
          ...prevData,
          'Fecha de nacimiento': formattedDate
        }));
        break;
      case 'documentDate':
        setDocumentDate(date);
        setFormData(prevData => ({
          ...prevData,
          'Fecha Documento': formattedDate
        }));
        break;
      case 'aptitudDate':
        setAptitudDate(date);
        setFormData(prevData => ({
          ...prevData,
          'Aptitud Fisica': formattedDate
        }));
        break;
      case 'vacunasDate':
        setVacunasDate(date);
        setFormData(prevData => ({
          ...prevData,
          'Vacunas': formattedDate
        }));
        break;
      case 'paiDate':
        setPaiDate(date);
        setFormData(prevData => ({
          ...prevData,
          'PAI': formattedDate
        }));
        break;
      default:
        break;
    }
  };

  // Confirmación para cambiar el Documento
  const confirmDocumentoChange = () => {
    setFormData(prevData => ({
      ...prevData,
      Documento: tempDocumento
    }));
    setShowDocumentoModal(false);
  };

  // Confirmación para cambiar el SIPI
  const confirmSipiChange = () => {
    setFormData(prevData => ({
      ...prevData,
      Sipi: tempSipi
    }));
    setShowSipiModal(false);
  };

  // Manejamos el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <Card className="shadow mb-4">
        <Card.Body>
          <Card.Title className="mb-4">
            <h3>{isEditing ? 'Editar Sujeto' : 'Agregar Nuevo Sujeto'}</h3>
          </Card.Title>
          
          <Form onSubmit={handleSubmit}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="personal" title="Datos Personales">
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="documento">
                      <Form.Label>Documento</Form.Label>
                      <Form.Control
                        type="text"
                        name="Documento"
                        value={formData.Documento}
                        onChange={isEditing ? () => setShowDocumentoModal(true) : handleChange}
                        required
                        className={isEditing ? "bg-light" : ""}
                      />
                      {isEditing && (
                        <Form.Text className="text-muted">
                          Haga clic para modificar (requiere confirmación)
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="familia">
                      <Form.Label>Familia</Form.Label>
                      {loadingFamilias ? (
                        <div className="d-flex align-items-center">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <span>Cargando familias...</span>
                        </div>
                      ) : (
                        <Form.Select
                          name="Familia"
                          value={formData.Familia}
                          onChange={handleChange}
                        >
                          <option value="">Seleccionar familia...</option>
                          {familias.map(familia => (
                            <option key={familia.id} value={familia.nombre}>
                              {familia.nombre}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      <Form.Text className="text-muted">
                        Seleccione la familia a la que pertenece el estudiante
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="apellido">
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control
                        type="text"
                        name="Apellido"
                        value={formData.Apellido}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="nombreCompleto">
                      <Form.Label>Nombre Completo</Form.Label>
                      <Form.Control
                        type="text"
                        name="Nombre Completo"
                        value={formData['Nombre Completo']}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="nombre">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        type="text"
                        name="Nombre"
                        value={formData.Nombre}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="sexo">
                      <Form.Label>Sexo</Form.Label>
                      <Form.Select
                        name="Sexo"
                        value={formData.Sexo}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="M">Mujer</option>
                        <option value="V">Varón</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="edad">
                      <Form.Label>Edad</Form.Label>
                      <Form.Control
                        type="number"
                        name="Edad"
                        value={formData.Edad}
                        onChange={handleChange}
                        required
                        readOnly
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Calculada automáticamente
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="fechaNacimiento">
                      <Form.Label>Fecha de Nacimiento</Form.Label>
                      <DatePicker
                        selected={birthDate}
                        onChange={(date) => handleDateChange(date, 'birthDate')}
                        dateFormat="dd/MM/yyyy"
                        className="form-control"
                        placeholderText="DD/MM/AAAA"
                        required
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="sipi">
                      <Form.Label>SIPI</Form.Label>
                      <Form.Control
                        type="text"
                        name="Sipi"
                        value={formData.Sipi}
                        onChange={isEditing ? () => setShowSipiModal(true) : handleChange}
                        className={isEditing ? "bg-light" : ""}
                      />
                      {isEditing && (
                        <Form.Text className="text-muted">
                          Haga clic para modificar (requiere confirmación)
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="turno">
                      <Form.Label>Turno</Form.Label>
                      <Form.Select
                        name="Turno"
                        value={formData.Turno}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="fechaDocumento">
                      <Form.Label>Fecha Documento</Form.Label>
                      <DatePicker
                        selected={documentDate}
                        onChange={(date) => handleDateChange(date, 'documentDate')}
                        dateFormat="dd/MM/yyyy"
                        className="form-control"
                        placeholderText="DD/MM/AAAA"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="documentacion" title="Documentación">
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="mb-3">Documentación Médica</Card.Title>
                        <Row>
                          <Col md={12} className="mb-4">
                            <Form.Group controlId="aptitudFisica">
                              <Form.Label className="mb-3 d-block">Aptitud Física</Form.Label>
                              <DatePicker
                                selected={aptitudDate}
                                onChange={(date) => handleDateChange(date, 'aptitudDate')}
                                dateFormat="dd/MM/yyyy"
                                className="form-control"
                                placeholderText="DD/MM/AAAA"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                              />
                              <Form.Text className="text-muted mt-2 d-block">
                                Fecha de vencimiento del certificado
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={12}>
                            <Form.Group controlId="vacunas">
                              <Form.Label className="mb-3 d-block">Vacunas</Form.Label>
                              <DatePicker
                                selected={vacunasDate}
                                onChange={(date) => handleDateChange(date, 'vacunasDate')}
                                dateFormat="dd/MM/yyyy"
                                className="form-control"
                                placeholderText="DD/MM/AAAA"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                              />
                              <Form.Text className="text-muted mt-2 d-block">
                                Fecha de última actualización
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title className="mb-3">Información Adicional</Card.Title>
                        <Row>
                          <Col md={12} className="mb-4">
                            <Form.Group controlId="afam">
                              <Form.Label className="mb-2">AFAM</Form.Label>
                              <Form.Select
                                name="AFAM"
                                value={formData.AFAM}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="">Seleccionar...</option>
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </Form.Select>
                              <Form.Text className="text-muted mt-2 d-block">
                                Asignaciones Familiares
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={12}>
                            <Form.Group controlId="pai">
                              <Form.Label className="mb-3 d-block">PAI</Form.Label>
                              <DatePicker
                                selected={paiDate}
                                onChange={(date) => handleDateChange(date, 'paiDate')}
                                dateFormat="dd/MM/yyyy"
                                className="form-control"
                                placeholderText="DD/MM/AAAA"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                              />
                              <Form.Text className="text-muted mt-2 d-block">
                                Fecha de último control
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Title className="mb-3">Servicios</Card.Title>
                        <Row>
                          <Col md={12} className="mb-4">
                            <Form.Group controlId="fonasa">
                              <Form.Label className="mb-2">Fonasa</Form.Label>
                              <Form.Select
                                name="Fonasa"
                                value={formData.Fonasa}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="">Seleccionar...</option>
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </Form.Select>
                              <Form.Text className="text-muted mt-2 d-block">
                                Fondo Nacional de Salud
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={12}>
                            <Form.Group controlId="diaPiscina">
                              <Form.Label className="mb-2">Día de Piscina</Form.Label>
                              <Form.Select
                                name="Dia de Piscina"
                                value={formData['Dia de Piscina']}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="">Seleccionar...</option>
                                {poolDays.map(day => (
                                  <option key={day.id} value={day.name}>{day.name}</option>
                                ))}
                              </Form.Select>
                              {poolDays.length === 0 ? (
                                <Form.Text className="text-warning mt-2 d-block">
                                  No hay días de piscina configurados. Configúrelos en el menú de configuración.
                                </Form.Text>
                              ) : (
                                <Form.Text className="text-muted mt-2 d-block">
                                  Día asignado para actividades acuáticas
                                </Form.Text>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
            </Tabs>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => window.history.back()}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Modal de confirmación para cambio de Documento */}
      <Modal show={showDocumentoModal} onHide={() => setShowDocumentoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar cambio de Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <Alert.Heading>¡Atención!</Alert.Heading>
            <p>El documento es un campo crítico que identifica al sujeto. Cambiar este valor puede afectar la integridad de los datos.</p>
          </Alert>
          <Form.Group controlId="modalDocumento">
            <Form.Label>Nuevo valor del Documento:</Form.Label>
            <Form.Control
              type="text"
              value={tempDocumento}
              onChange={(e) => setTempDocumento(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocumentoModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDocumentoChange}>
            Confirmar cambio
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmación para cambio de SIPI */}
      <Modal show={showSipiModal} onHide={() => setShowSipiModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar cambio de SIPI</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <Alert.Heading>¡Atención!</Alert.Heading>
            <p>El código SIPI es un campo crítico que identifica al sujeto en el sistema SIPI. Cambiar este valor puede afectar la sincronización con el archivo SIPI.</p>
          </Alert>
          <Form.Group controlId="modalSipi">
            <Form.Label>Nuevo valor de SIPI:</Form.Label>
            <Form.Control
              type="text"
              value={tempSipi}
              onChange={(e) => setTempSipi(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSipiModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmSipiChange}>
            Confirmar cambio
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StudentForm;
