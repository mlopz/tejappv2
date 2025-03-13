import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Modal, Form, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { FiSettings, FiCalendar, FiInfo, FiHelpCircle, FiUserPlus, FiDownload, FiUpload, FiCheck, FiUserCheck, FiUsers, FiActivity, FiUserX } from 'react-icons/fi';
import DataService from '../services/DataService';
import FirebaseConfigModal from './FirebaseConfigModal';
import SyncStatusIndicator from './SyncStatusIndicator';

const AppNavbar = ({ data, onImport, selectedStudents = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [exportType, setExportType] = useState('all'); // 'all' o 'selected'
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv', 'excel', 'json'
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  
  // Referencia para el input de archivo
  const fileInputRef = React.useRef(null);
  
  // Efecto para inicializar las columnas disponibles cuando cambian los datos
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      setAvailableColumns(columns);
      setSelectedColumns(columns); // Por defecto, seleccionar todas las columnas
    }
  }, [data]);
  
  // Manejador para el botón de importar
  const handleImportClick = () => {
    fileInputRef.current.click();
  };
  
  // Manejador para cuando se selecciona un archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImport(file);
    }
    // Reseteamos el input para poder seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  // Manejadores de navegación directa con forzado de recarga cuando sea necesario
  const handleNavigation = (path) => {
    // Si ya estamos en la ruta de estudiantes y queremos ir a otra página, forzar recarga
    if (location.pathname.includes('/student') && !path.includes('/student')) {
      // Usar window.location para forzar una recarga completa
      window.location.href = path;
    } else {
      // Navegación normal para otros casos
      navigate(path);
    }
  };

  // Determinar si estamos en la página de estudiantes
  const isStudentsPage = location.pathname.includes('/student');
  
  // Determinar si hay estudiantes seleccionados
  const hasSelectedStudents = selectedStudents && selectedStudents.length > 0;
  
  // Manejador para seleccionar/deseleccionar todas las columnas
  const handleSelectAllColumns = (e) => {
    if (e.target.checked) {
      setSelectedColumns([...availableColumns]);
    } else {
      setSelectedColumns([]);
    }
  };
  
  // Manejador para seleccionar/deseleccionar una columna individual
  const handleColumnSelection = (column, isSelected) => {
    if (isSelected) {
      setSelectedColumns(prev => [...prev, column]);
    } else {
      setSelectedColumns(prev => prev.filter(col => col !== column));
    }
  };
  
  // Obtener los datos a exportar según el contexto
  const getDataToExport = () => {
    console.log('Tipo de exportación:', exportType);
    console.log('Estudiantes seleccionados:', selectedStudents);
    
    let dataToExport = [];
    
    // Filtrar por estudiantes seleccionados o todos
    if (exportType === 'selected' && hasSelectedStudents) {
      // Exportar solo los estudiantes seleccionados
      console.log('Filtrando estudiantes seleccionados...');
      
      // Asegurarse de que cada estudiante tenga un ID para comparar
      const dataWithIds = data.map((student, index) => {
        // Usar Documento como ID principal, o un ID generado si no existe
        const id = student.Documento || `student-index-${index}`;
        return {
          ...student,
          id: id
        };
      });
      
      dataToExport = dataWithIds.filter(student => {
        const result = selectedStudents.includes(student.id);
        console.log('Estudiante:', student.id, 'Seleccionado:', result);
        return result;
      });
    } else {
      // Exportar todos los estudiantes
      dataToExport = [...data];
    }
    
    console.log('Datos a exportar (antes de filtrar columnas):', dataToExport.length);
    
    // Filtrar columnas seleccionadas
    if (selectedColumns.length < availableColumns.length) {
      dataToExport = dataToExport.map(student => {
        const filteredStudent = {};
        selectedColumns.forEach(column => {
          filteredStudent[column] = student[column];
        });
        return filteredStudent;
      });
    }
    
    console.log('Datos a exportar (después de filtrar columnas):', dataToExport.length);
    return dataToExport;
  };

  // Función para abrir el modal de exportación
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Función para realizar la exportación
  const handleExport = () => {
    const dataToExport = getDataToExport();
    
    if (dataToExport.length === 0) {
      alert('No hay datos para exportar. Por favor, selecciona al menos un estudiante.');
      return;
    }
    
    switch (exportFormat) {
      case 'csv':
        // La exportación CSV se maneja directamente por el componente CSVLink
        document.getElementById('csv-download-link').click();
        break;
      case 'excel':
        exportToExcel(dataToExport);
        break;
      case 'json':
        exportToJSON(dataToExport);
        break;
      default:
        break;
    }
    
    setShowExportModal(false);
  };

  // Función para exportar en formato JSON
  const exportToJSON = (dataToExport) => {
    const url = DataService.exportToJSON(dataToExport);
    const link = document.createElement('a');
    link.href = url;
    link.download = "tejanitos-database.json";
    link.click();
    // Liberamos la URL para evitar fugas de memoria
    URL.revokeObjectURL(url);
  };

  // Función para exportar en formato Excel (XLSX)
  const exportToExcel = (dataToExport) => {
    const url = DataService.exportToExcel(dataToExport);
    const link = document.createElement('a');
    link.href = url;
    link.download = "tejanitos-database.xlsx";
    link.click();
    // Liberamos la URL para evitar fugas de memoria
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Dropdown>
            <Dropdown.Toggle 
              as={Navbar.Brand}
              id="dropdown-tejanitos"
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              Tejanitos
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleNavigation('/add-student')}>
                <FiUserPlus className="me-2" /> Agregar Estudiante
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => handleNavigation('/inactive-students')}>
                <FiUserX className="me-2" /> Estudiantes Inactivos
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={() => handleNavigation('/familias')}>
                <FiUsers className="me-2" /> Gestionar Familias
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => handleNavigation('/intervenciones/individuales')}>
                <FiActivity className="me-2" /> Intervenciones Individuales
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => handleNavigation('/intervenciones/familiares')}>
                <FiActivity className="me-2" /> Intervenciones Familiares
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => handleNavigation('/intervenciones/instituciones')}>
                <FiActivity className="me-2" /> Intervenciones con Instituciones
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={() => handleNavigation('/pool-config')}>
                <FiCalendar className="me-2" /> Configurar días de piscina
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={handleExportClick}>
                <FiDownload className="me-2" /> Exportar datos
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={() => handleNavigation('/admin')}>
                <FiSettings className="me-2" /> Administración
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => setShowFirebaseModal(true)}>
                <FiSettings className="me-2" /> Configuración general
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleNavigation('/about')}>
                <FiInfo className="me-2" /> Acerca de Tejanitos
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleNavigation('/help')}>
                <FiHelpCircle className="me-2" /> Ayuda
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                onClick={() => handleNavigation('/')}
                style={{ cursor: 'pointer' }}
              >
                Inicio
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleNavigation('/students')}
                style={{ cursor: 'pointer' }}
              >
                Estudiantes
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleNavigation('/inactive-students')}
                style={{ cursor: 'pointer' }}
              >
                Estudiantes Inactivos
              </Nav.Link>
              <Nav.Link 
                onClick={() => handleNavigation('/familias')}
                style={{ cursor: 'pointer' }}
              >
                Familias
              </Nav.Link>
              <Dropdown as={Nav.Item}>
                <Dropdown.Toggle as={Nav.Link} style={{ cursor: 'pointer' }}>
                  Intervenciones
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleNavigation('/intervenciones/individuales')}>
                    Individuales
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation('/intervenciones/familiares')}>
                    Familiares
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation('/intervenciones/instituciones')}>
                    Con Instituciones
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Nav.Link 
                onClick={() => handleNavigation('/reports')}
                style={{ cursor: 'pointer' }}
              >
                Reportes
              </Nav.Link>
            </Nav>
            <div className="d-flex gap-2">
              <SyncStatusIndicator />
              <Button 
                variant="outline-light" 
                onClick={handleImportClick}
                className="d-flex align-items-center"
              >
                <FiUpload className="me-2" /> Cargar SIPI
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".csv,.xls,.xlsx"
              />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal para opciones de exportación */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Opciones de Exportación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>¿Qué datos deseas exportar?</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Todos los datos"
                      name="exportType"
                      id="export-all"
                      checked={exportType === 'all'}
                      onChange={() => setExportType('all')}
                    />
                    <Form.Check
                      type="radio"
                      label={`Filas seleccionadas (${hasSelectedStudents ? selectedStudents.length : 0})`}
                      name="exportType"
                      id="export-selected"
                      checked={exportType === 'selected'}
                      onChange={() => setExportType('selected')}
                      disabled={!hasSelectedStudents}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Formato de exportación</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="CSV (compatible con Excel)"
                      name="exportFormat"
                      id="format-csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                    />
                    <Form.Check
                      type="radio"
                      label="Excel (XLSX)"
                      name="exportFormat"
                      id="format-excel"
                      checked={exportFormat === 'excel'}
                      onChange={() => setExportFormat('excel')}
                    />
                    <Form.Check
                      type="radio"
                      label="JSON (para desarrolladores)"
                      name="exportFormat"
                      id="format-json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                    />
                  </div>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Columnas a exportar</Form.Label>
                  <div className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label="Seleccionar todas las columnas"
                      id="select-all-columns"
                      checked={selectedColumns.length === availableColumns.length}
                      onChange={handleSelectAllColumns}
                    />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                    {availableColumns.map(column => (
                      <Form.Check
                        key={column}
                        type="checkbox"
                        label={column}
                        id={`column-${column}`}
                        checked={selectedColumns.includes(column)}
                        onChange={(e) => handleColumnSelection(column, e.target.checked)}
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExport}
            className="d-flex align-items-center"
            disabled={selectedColumns.length === 0}
          >
            <FiCheck className="me-2" /> Exportar
          </Button>
          
          {/* Link oculto para la descarga CSV */}
          <div style={{ display: 'none' }}>
            <CSVLink
              id="csv-download-link"
              data={getDataToExport()}
              filename={"tejanitos-database.csv"}
              separator=";"
            />
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal para configuración de Firebase */}
      <FirebaseConfigModal 
        show={showFirebaseModal} 
        onHide={() => setShowFirebaseModal(false)} 
      />
    </>
  );
};

export default AppNavbar;
