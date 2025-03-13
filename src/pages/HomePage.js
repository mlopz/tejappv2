import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiHome,
  FiFileText,
  FiSettings,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiDatabase
} from 'react-icons/fi';
import { CSS } from '@dnd-kit/utilities';
import DataService from '../services/DataService';
import SIPIFileUploader from '../components/SIPIFileUploader';
import FirebaseConfigModal from '../components/FirebaseConfigModal';
import { generateUniqueKeyForItem } from '../utils/uniqueKeyGenerator';

// Componente de tarjeta sortable
const SortableCard = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
    height: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const HomePage = ({ students }) => {
  const navigate = useNavigate();

  // Estado para ordenamiento de la tabla de documentos
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  // Estado para estudiantes seleccionados
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Estado para el modal de actualización de fecha
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [studentDates, setStudentDates] = useState({});

  // Estado para el modal de carga de archivo SIPI
  const [showSIPIModal, setShowSIPIModal] = useState(false);

  // Estado para el modal de configuración de Firebase
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // Función para seleccionar/deseleccionar todos los estudiantes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(sortedData.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Función para seleccionar/deseleccionar un estudiante
  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // Función para actualizar la fecha de Aptitud Física
  const handleUpdateAptitudFisica = () => {
    // Validar que la fecha tenga el formato correcto (DD/MM/YYYY)
    const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/;
    for (const id in studentDates) {
      if (!dateRegex.test(studentDates[id])) {
        alert('Por favor, ingrese una fecha válida en formato DD/MM/YYYY');
        return;
      }
    }

    // Actualizar la fecha de Aptitud Física de los estudiantes seleccionados
    const updatedStudents = DataService.updateMultipleAptitudFisica(students, selectedStudents, studentDates);
    
    // Cerrar el modal y limpiar el estado
    setShowUpdateModal(false);
    setStudentDates({});
    
    // Recargar la página para mostrar los cambios
    window.location.reload();
  };

  // Función para manejar la actualización de datos después de procesar el archivo SIPI
  const handleSIPIFileProcessed = (updatedStudents) => {
    console.log('Datos actualizados recibidos en HomePage:', updatedStudents.length);
    
    // Forzar recarga de la página para mostrar los datos actualizados
    window.location.reload();
    
    // Cerrar el modal
    setShowSIPIModal(false);
  };

  // Calculamos estadísticas básicas
  const activeStudents = students.filter(student => student.Activo !== false);
  const totalStudents = activeStudents.length;
  const maleStudents = activeStudents.filter(student => student.Sexo === 'V').length;
  const femaleStudents = activeStudents.filter(student => student.Sexo === 'M').length;
  const morningStudents = activeStudents.filter(student => student.Turno === 'Matutino').length;
  const afternoonStudents = activeStudents.filter(student => student.Turno === 'Vespertino').length;

  // Función para obtener estudiantes con documentos próximos a vencer
  const getStudentsWithExpiringDocuments = () => {
    const today = new Date();
    
    return students.filter(student => {
      // Verificamos aptitud física
      if (student['Aptitud Fisica']) {
        const parts = student['Aptitud Fisica'].split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          const aptitudDate = new Date(year, month, day);
          const diffTime = aptitudDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0 && diffDays <= 30) {
            return true;
          }
        }
      }
      
      // Verificamos vacunas
      if (student.Vacunas) {
        const parts = student.Vacunas.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          const vacunasDate = new Date(year, month, day);
          const diffTime = vacunasDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0 && diffDays <= 30) {
            return true;
          }
        }
      }
      
      return false;
    });
  };

  // Función para obtener estudiantes con documentos vencidos
  const getStudentsWithExpiredDocuments = () => {
    const today = new Date();
    
    return students.filter(student => {
      // Verificamos aptitud física
      if (student['Aptitud Fisica']) {
        const parts = student['Aptitud Fisica'].split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          const aptitudDate = new Date(year, month, day);
          
          if (aptitudDate < today) {
            return true;
          }
        }
      }
      
      // Verificamos vacunas
      if (student.Vacunas) {
        const parts = student.Vacunas.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          const vacunasDate = new Date(year, month, day);
          
          if (vacunasDate < today) {
            return true;
          }
        }
      }
      
      return false;
    });
  };

  // Función para preparar los datos de documentos vencidos para la tabla
  const prepareExpiredDocumentsData = () => {
    const today = new Date();
    const result = [];
    
    students.forEach(student => {
      let aptitudStatus = 'valid'; // 'valid', 'expiring', 'expired'
      let aptitudDate = null;
      
      // Verificamos aptitud física
      if (student['Aptitud Fisica']) {
        const parts = student['Aptitud Fisica'].split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          aptitudDate = new Date(year, month, day);
          
          // Verificar si está vencido
          if (aptitudDate < today) {
            aptitudStatus = 'expired';
          } else {
            // Verificar si está por vencer (menos de 30 días)
            const diffTime = aptitudDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 30) {
              aptitudStatus = 'expiring';
            }
          }
        }
      }
      
      // Solo incluimos si está vencido o por vencer
      if (aptitudStatus === 'expired' || aptitudStatus === 'expiring') {
        result.push({
          id: student.Documento,
          nombre: student['Nombre Completo'],
          aptitudFisica: student['Aptitud Fisica'],
          aptitudStatus,
          turno: student.Turno || 'No asignado',
          diaPiscina: student['Dia de Piscina'] || 'No asignado'
        });
      }
    });
    
    return result;
  };

  // Función auxiliar para convertir una fecha en formato DD/MM/YYYY a objeto Date
  const parseDate = (dateString) => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(0); // Fecha por defecto si el formato es incorrecto
  };

  // Función para ordenar los datos de la tabla
  const sortedData = useMemo(() => {
    const dataToSort = prepareExpiredDocumentsData();
    if (!sortConfig.key) return dataToSort;
    
    return [...dataToSort].sort((a, b) => {
      // Ordenamiento especial para fechas (aptitudFisica)
      if (sortConfig.key === 'aptitudFisica') {
        // Convertir fechas de formato DD/MM/YYYY a objetos Date para comparación
        const dateA = a.aptitudFisica ? parseDate(a.aptitudFisica) : new Date(0);
        const dateB = b.aptitudFisica ? parseDate(b.aptitudFisica) : new Date(0);
        
        if (dateA < dateB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (dateA > dateB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }
      
      // Ordenamiento normal para otros campos
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [students, sortConfig]);

  // Función para solicitar ordenamiento
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Función para obtener el indicador de dirección de ordenamiento
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  // Función para obtener estudiantes con documentación faltante
  const getStudentsWithMissingDocuments = () => {
    return activeStudents.filter(student => {
      // Verificar si falta algún documento
      return !student.aptitudFisicaDate || !student.vacunasDate || !student.paiDate;
    });
  };
  
  // Función para obtener estudiantes con aptitud física faltante
  const getStudentsWithMissingAptitud = () => {
    return activeStudents.filter(student => !student.aptitudFisicaDate);
  };
  
  // Función para obtener estudiantes con vacunas faltantes
  const getStudentsWithMissingVacunas = () => {
    return activeStudents.filter(student => !student.vacunasDate);
  };
  
  // Función para obtener estudiantes con PAI faltante
  const getStudentsWithMissingPAI = () => {
    return activeStudents.filter(student => !student.paiDate);
  };

  // Definimos las tarjetas iniciales
  const initialCards = [
    {
      id: 'total',
      title: 'Total Estudiantes',
      value: totalStudents,
      buttonVariant: 'primary',
      buttonText: 'Ver Todos',
      onClick: () => navigate('/students')
    },
    {
      id: 'morning',
      title: 'Turno Matutino',
      value: morningStudents,
      buttonVariant: 'warning',
      buttonText: 'Ver Detalles',
      onClick: () => navigate('/students', { state: { initialFilter: { Turno: 'Matutino' } } })
    },
    {
      id: 'afternoon',
      title: 'Turno Vespertino',
      value: afternoonStudents,
      buttonVariant: 'info',
      buttonText: 'Ver Detalles',
      onClick: () => navigate('/students', { state: { initialFilter: { Turno: 'Vespertino' } } })
    },
    {
      id: 'expiring',
      title: 'Documentos por Vencer',
      value: getStudentsWithExpiringDocuments().length,
      buttonVariant: 'danger',
      buttonText: 'Ver Alertas',
      onClick: () => navigate('/reports/expiring')
    },
    {
      id: 'missing',
      title: 'Estudiantes con Documentación Faltante',
      value: getStudentsWithMissingDocuments().length,
      buttonVariant: 'danger',
      buttonText: 'Ver Detalles',
      onClick: () => navigate('/missing-documentation')
    }
  ];

  // Estado para las tarjetas
  const [cards, setCards] = useState(initialCards);

  // Configurar sensores para detectar eventos de arrastre
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Distancia mínima para activar el arrastre
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manejar el final del arrastre
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      setCards((items) => {
        // Encontrar los índices de los elementos
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);
        
        // Reordenar el array
        return arrayMove(items, activeIndex, overIndex);
      });
    }
  };

  // Datos para el gráfico de distribución por sexo
  const genderData = [
    { name: 'Varones', value: maleStudents },
    { name: 'Mujeres', value: femaleStudents },
  ];

  // Datos para el gráfico de distribución por turno
  const shiftData = [
    { name: 'Matutino', value: morningStudents },
    { name: 'Vespertino', value: afternoonStudents },
  ];

  // Colores para los gráficos
  const GENDER_COLORS = ['#3498db', '#e74c3c'];
  const SHIFT_COLORS = ['#f39c12', '#9b59b6'];

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Tejanitos</h1>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowFirebaseModal(true)}
          >
            <FiSettings /> Configurar Firebase
          </Button>
          <Button
            variant="secondary"
            as={Link}
            to="/admin"
          >
            <FiDatabase /> Administración
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <style>
          {`
            .card-container {
              cursor: grab;
            }
            .card-container:active {
              cursor: grabbing;
            }
            .dragging-card {
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            }
          `}
        </style>
        <Row className="mb-4">
          <SortableContext
            items={cards.map(card => card.id)}
            strategy={horizontalListSortingStrategy}
          >
            {cards.map((card) => (
              <Col md={3} key={card.id}>
                <SortableCard id={card.id}>
                  <Card className="text-center h-100 shadow-sm">
                    <Card.Body>
                      <h1 className="display-4">{card.value}</h1>
                      <Card.Title>{card.title}</Card.Title>
                    </Card.Body>
                    <Card.Footer>
                      <Button 
                        variant={card.buttonVariant} 
                        onClick={card.onClick}
                      >
                        {card.buttonText}
                      </Button>
                    </Card.Footer>
                  </Card>
                </SortableCard>
              </Col>
            ))}
          </SortableContext>
        </Row>
      </DndContext>

      <Row className="mb-5">
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Distribución por Sexo</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Distribución por Turno</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shiftData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {shiftData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SHIFT_COLORS[index % SHIFT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Documentos Vencidos</h5>
            </Card.Header>
            <Card.Body>
              {sortedData.length === 0 ? (
                <p className="text-center">No hay documentos vencidos.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.length === sortedData.length} 
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th onClick={() => requestSort('id')}>Documento{getSortDirectionIndicator('id')}</th>
                      <th onClick={() => requestSort('nombre')}>Nombre{getSortDirectionIndicator('nombre')}</th>
                      <th onClick={() => requestSort('aptitudFisica')}>Aptitud Física{getSortDirectionIndicator('aptitudFisica')}</th>
                      <th onClick={() => requestSort('turno')}>Turno{getSortDirectionIndicator('turno')}</th>
                      <th onClick={() => requestSort('diaPiscina')}>Día de Piscina{getSortDirectionIndicator('diaPiscina')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((student, index) => (
                      <tr key={generateUniqueKeyForItem(student, index, 'home-student')}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(student.id)} 
                            onChange={() => handleSelectStudent(student.id)}
                          />
                        </td>
                        <td>{student.id}</td>
                        <td>{student.nombre}</td>
                        <td>
                          {student.aptitudFisica} 
                          {student.aptitudStatus === 'expired' && 
                            <Badge bg="danger" className="ms-2">Vencido</Badge>
                          }
                          {student.aptitudStatus === 'expiring' && 
                            <Badge bg="warning" className="ms-2">Por Vencer</Badge>
                          }
                        </td>
                        <td>{student.turno}</td>
                        <td>{student.diaPiscina}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
            <Card.Footer>
              <Button 
                variant="danger" 
                onClick={() => navigate('/reports/expired')}
                className="me-2"
              >
                Ver Detalles
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  // Inicializar las fechas con los valores actuales
                  const initialDates = {};
                  selectedStudents.forEach(id => {
                    const student = sortedData.find(s => s.id === id);
                    if (student) {
                      initialDates[id] = student.aptitudFisica;
                    }
                  });
                  setStudentDates(initialDates);
                  setShowUpdateModal(true);
                }}
                disabled={selectedStudents.length === 0}
              >
                Actualizar Aptitud Física
              </Button>
              <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Actualizar Aptitud Física</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <p>Ingrese la fecha de Aptitud Física para los estudiantes seleccionados:</p>
                  {selectedStudents.map(id => {
                    const student = students.find(s => s.Documento === id);
                    return (
                      <Form.Group key={id} className="mb-3">
                        <Form.Label>{student['Nombre Completo']}</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="DD/MM/YYYY"
                          value={studentDates[id] || ''}
                          onChange={(e) => setStudentDates({...studentDates, [id]: e.target.value})}
                        />
                      </Form.Group>
                    );
                  })}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleUpdateAptitudFisica}>
                    Guardar
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <SIPIFileUploader 
        show={showSIPIModal} 
        onHide={() => setShowSIPIModal(false)} 
        onFileProcessed={handleSIPIFileProcessed}
        students={students}
      />
      <FirebaseConfigModal 
        show={showFirebaseModal} 
        onHide={() => setShowFirebaseModal(false)} 
      />
    </Container>
  );
};

export default HomePage;
