import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Nav, Alert } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import PoolConfigService from '../services/PoolConfigService';
import { useLocation } from 'react-router-dom';
import { generateUniqueKeyForItem } from '../utils/uniqueKeyGenerator';

const ReportsPage = ({ students = [] }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('expiring');
  const [sortConfig, setSortConfig] = useState({
    expiring: { key: null, direction: 'ascending' },
    expired: { key: null, direction: 'ascending' },
    pool: { key: null, direction: 'ascending' },
    shift: { key: null, direction: 'ascending' },
    age: { key: null, direction: 'ascending' }
  });
  const [poolDays, setPoolDays] = useState([]);

  // Estilos globales para las tarjetas
  const cardHeaderStyle = "bg-light text-dark";
  const cardHeaderWithButtonsStyle = "bg-light text-dark d-flex justify-content-between align-items-center";
  const exportButtonStyle = "btn btn-sm btn-primary";

  // Detectar la pestaña activa basada en la URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/reports/expired')) {
      setActiveTab('expired');
    } else if (path.includes('/reports/expiring')) {
      setActiveTab('expiring');
    } else if (path.includes('/reports/pool')) {
      setActiveTab('pool');
    } else if (path.includes('/reports/shift')) {
      setActiveTab('shift');
    } else if (path.includes('/reports/group')) {
      setActiveTab('group');
    }
  }, [location.pathname]);

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

  // Función para determinar si una fecha está próxima a vencer (menos de 30 días)
  const isDateNearExpiration = (dateStr) => {
    if (!dateStr) return false;
    
    // Convertir la fecha del formato DD/MM/YYYY a un objeto Date
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0 a 11
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    
    // Calcular la diferencia en días
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para determinar si una fecha está vencida
  const isDateExpired = (dateStr) => {
    if (!dateStr) return false;
    
    // Convertir la fecha del formato DD/MM/YYYY a un objeto Date
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0 a 11
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    
    return date < today;
  };

  // Obtener estudiantes con documentos próximos a vencer
  const studentsWithExpiringDocuments = students.filter(student => {
    return (
      isDateNearExpiration(student['Aptitud Fisica']) ||
      isDateNearExpiration(student.Vacunas)
    );
  });

  // Obtener estudiantes con documentos vencidos
  const studentsWithExpiredDocuments = students.filter(student => {
    return (
      isDateExpired(student['Aptitud Fisica']) ||
      isDateExpired(student.Vacunas)
    );
  });

  // Agrupar estudiantes por día de piscina y turno
  const studentsByPoolDayAndShift = useMemo(() => {
    const result = {
      Matutino: {},
      Vespertino: {}
    };
    
    // Inicializar los días configurados para cada turno
    poolDays.forEach(day => {
      result.Matutino[day.name] = [];
      result.Vespertino[day.name] = [];
    });
    
    // Asignar estudiantes a sus respectivos días y turnos
    students.forEach(student => {
      const turno = student.Turno || 'Sin Asignar';
      const diaPiscina = student['Dia de Piscina'];
      
      // Verificar si es un día de piscina válido
      if (diaPiscina && poolDays.some(day => day.name === diaPiscina)) {
        if (turno === 'Matutino') {
          result.Matutino[diaPiscina] = result.Matutino[diaPiscina] || [];
          result.Matutino[diaPiscina].push(student);
        } else if (turno === 'Vespertino') {
          result.Vespertino[diaPiscina] = result.Vespertino[diaPiscina] || [];
          result.Vespertino[diaPiscina].push(student);
        }
      }
    });
    
    return result;
  }, [students, poolDays]);

  // Agrupar estudiantes por día de piscina
  const studentsByPoolDay = useMemo(() => {
    const result = {};
    
    // Agregar los días configurados
    poolDays.forEach(day => {
      result[day.name] = students.filter(student => student['Dia de Piscina'] === day.name);
    });
    
    // Agregar estudiantes sin día asignado
    result['Sin Asignar'] = students.filter(student => 
      !student['Dia de Piscina'] || 
      !poolDays.some(day => day.name === student['Dia de Piscina'])
    );
    
    return result;
  }, [students, poolDays]);

  // Agrupar estudiantes por turno
  const studentsByShift = {
    Matutino: students.filter(student => student.Turno === 'Matutino'),
    Vespertino: students.filter(student => student.Turno === 'Vespertino'),
    'Sin Asignar': students.filter(student => !student.Turno)
  };

  // Agrupar estudiantes por grupos (antes era por edad)
  const studentsByGroup = useMemo(() => {
    const result = {
      'Grupo 1 (2-3 años)': [],
      'Grupo 2 (4-5 años)': [],
      'Grupo 3 (6-8 años)': [],
      'Grupo 4 (9-12 años)': [],
      'Grupo 5 (13+ años)': [],
      'Sin Grupo': []
    };
    
    students.forEach(student => {
      const age = parseInt(student.Edad);
      
      if (isNaN(age)) {
        result['Sin Grupo'].push(student);
      } else if (age <= 3) {
        result['Grupo 1 (2-3 años)'].push(student);
      } else if (age <= 5) {
        result['Grupo 2 (4-5 años)'].push(student);
      } else if (age <= 8) {
        result['Grupo 3 (6-8 años)'].push(student);
      } else if (age <= 12) {
        result['Grupo 4 (9-12 años)'].push(student);
      } else {
        result['Grupo 5 (13+ años)'].push(student);
      }
    });
    
    // Eliminar grupos vacíos
    Object.keys(result).forEach(key => {
      if (result[key].length === 0) {
        delete result[key];
      }
    });
    
    return result;
  }, [students]);

  // Función para solicitar ordenamiento
  const requestSort = (reportType, key) => {
    setSortConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      if (newConfig[reportType].key === key) {
        // Cambiar dirección si ya está ordenado por esta columna
        newConfig[reportType].direction = 
          newConfig[reportType].direction === 'ascending' ? 'descending' : 'ascending';
      } else {
        // Nueva columna, establecer orden ascendente
        newConfig[reportType].key = key;
        newConfig[reportType].direction = 'ascending';
      }
      return newConfig;
    });
  };

  // Función para obtener el indicador de dirección
  const getSortDirectionIndicator = (reportType, key) => {
    if (sortConfig[reportType].key !== key) {
      return null;
    }
    return sortConfig[reportType].direction === 'ascending' ? 
      <span className="sort-indicator">▲</span> : 
      <span className="sort-indicator">▼</span>;
  };

  // Función para ordenar datos
  const sortData = (data, reportType) => {
    const { key, direction } = sortConfig[reportType];
    if (!key) return data;

    return [...data].sort((a, b) => {
      // Manejar valores nulos o indefinidos
      if (!a[key] && !b[key]) return 0;
      if (!a[key]) return 1;
      if (!b[key]) return -1;
      
      // Comparar valores
      let aValue = a[key];
      let bValue = b[key];
      
      // Si son fechas en formato DD/MM/YYYY, convertirlas para comparación
      if (typeof aValue === 'string' && aValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [aDay, aMonth, aYear] = aValue.split('/').map(Number);
        const [bDay, bMonth, bYear] = bValue.split('/').map(Number);
        aValue = new Date(aYear, aMonth - 1, aDay);
        bValue = new Date(bYear, bMonth - 1, bDay);
      }
      // Si son números, convertirlos para comparación numérica
      else if (!isNaN(aValue) && !isNaN(bValue)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Comparación estándar
      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Ordenar los datos para cada reporte
  const sortedExpiringDocuments = useMemo(() => 
    sortData(studentsWithExpiringDocuments, 'expiring'), 
    [studentsWithExpiringDocuments, sortConfig.expiring]
  );

  const sortedExpiredDocuments = useMemo(() => 
    sortData(studentsWithExpiredDocuments, 'expired'), 
    [studentsWithExpiredDocuments, sortConfig.expired]
  );

  // Renderizar el reporte de documentos por vencer
  const renderExpiringDocumentsReport = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-warning text-dark">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Documentos Próximos a Vencer</h5>
            <CSVLink
              data={studentsWithExpiringDocuments}
              filename={"documentos-por-vencer.csv"}
              className="btn btn-sm btn-dark"
              separator=";"
            >
              Exportar CSV
            </CSVLink>
          </div>
        </Card.Header>
        <Card.Body>
          {sortedExpiringDocuments.length === 0 ? (
            <p className="text-center">No hay documentos próximos a vencer.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expiring', 'Documento')}
                    style={{ cursor: 'pointer' }}
                  >
                    Documento {getSortDirectionIndicator('expiring', 'Documento')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expiring', 'Nombre Completo')}
                    style={{ cursor: 'pointer' }}
                  >
                    Nombre Completo {getSortDirectionIndicator('expiring', 'Nombre Completo')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expiring', 'Aptitud Fisica')}
                    style={{ cursor: 'pointer' }}
                  >
                    Aptitud Física {getSortDirectionIndicator('expiring', 'Aptitud Fisica')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expiring', 'Vacunas')}
                    style={{ cursor: 'pointer' }}
                  >
                    Vacunas {getSortDirectionIndicator('expiring', 'Vacunas')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedExpiringDocuments.map((student, index) => (
                  <tr key={generateUniqueKeyForItem(student, index, 'expiring-doc')}>
                    <td>{student.Documento}</td>
                    <td>{student['Nombre Completo']}</td>
                    <td className={isDateNearExpiration(student['Aptitud Fisica']) ? 'bg-warning text-dark' : ''}>
                      {student['Aptitud Fisica'] || 'N/A'}
                    </td>
                    <td className={isDateNearExpiration(student.Vacunas) ? 'bg-warning text-dark' : ''}>
                      {student.Vacunas || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Renderizar el reporte de documentos vencidos
  const renderExpiredDocumentsReport = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-danger text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Documentos Vencidos</h5>
            <CSVLink
              data={studentsWithExpiredDocuments}
              filename={"documentos-vencidos.csv"}
              className="btn btn-sm btn-light"
              separator=";"
            >
              Exportar CSV
            </CSVLink>
          </div>
        </Card.Header>
        <Card.Body>
          {sortedExpiredDocuments.length === 0 ? (
            <p className="text-center">No hay documentos vencidos.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expired', 'Documento')}
                    style={{ cursor: 'pointer' }}
                  >
                    Documento {getSortDirectionIndicator('expired', 'Documento')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expired', 'Nombre Completo')}
                    style={{ cursor: 'pointer' }}
                  >
                    Nombre Completo {getSortDirectionIndicator('expired', 'Nombre Completo')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expired', 'Aptitud Fisica')}
                    style={{ cursor: 'pointer' }}
                  >
                    Aptitud Física {getSortDirectionIndicator('expired', 'Aptitud Fisica')}
                  </th>
                  <th 
                    className="column-header" 
                    onClick={() => requestSort('expired', 'Vacunas')}
                    style={{ cursor: 'pointer' }}
                  >
                    Vacunas {getSortDirectionIndicator('expired', 'Vacunas')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedExpiredDocuments.map((student, index) => (
                  <tr key={generateUniqueKeyForItem(student, index, 'expired-doc')}>
                    <td>{student.Documento}</td>
                    <td>{student['Nombre Completo']}</td>
                    <td className={isDateExpired(student['Aptitud Fisica']) ? 'bg-danger text-white' : ''}>
                      {student['Aptitud Fisica'] || 'N/A'}
                    </td>
                    <td className={isDateExpired(student.Vacunas) ? 'bg-danger text-white' : ''}>
                      {student.Vacunas || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Renderizar el reporte de piscina
  const renderPoolReport = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Distribución por Día de Piscina</h5>
          </div>
        </Card.Header>
        <Card.Body>
          {poolDays.length === 0 ? (
            <Alert variant="info">
              No hay días de piscina configurados. Por favor, configure los días de piscina en el menú de configuración.
            </Alert>
          ) : (
            <>
              {/* Sección Matutino */}
              <Card className="mb-4">
                <Card.Header className={cardHeaderStyle}>
                  <h5 className="mb-0"><strong>Turno Matutino</strong></h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {Object.entries(studentsByPoolDayAndShift.Matutino)
                      .filter(([day, students]) => day === 'Viernes')
                      .map(([day, dayStudents]) => (
                        <Col md={12} key={`matutino-${day}`} className="mb-3">
                          <Card>
                            <Card.Header className={cardHeaderWithButtonsStyle} data-component-name="ReportsPage">
                              <h5 className="mb-0"><strong>Matutino - {day}</strong></h5>
                              <CSVLink
                                data={getCSVData(dayStudents)}
                                filename={`matutino-${day.toLowerCase()}.csv`}
                                className={exportButtonStyle}
                                separator=";"
                              >
                                Exportar CSV
                              </CSVLink>
                            </Card.Header>
                            <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                              <p className="text-center mb-3">{dayStudents.length}</p>
                              {dayStudents.length === 0 ? (
                                <p className="text-center">No hay estudiantes asignados.</p>
                              ) : (
                                <Table striped bordered hover responsive>
                                  <thead>
                                    <tr>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Documento')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Documento {getSortDirectionIndicator('pool', 'Documento')}
                                      </th>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Nombre Completo')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Nombre Completo {getSortDirectionIndicator('pool', 'Nombre Completo')}
                                      </th>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Edad')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Edad {getSortDirectionIndicator('pool', 'Edad')}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dayStudents.map((student, index) => (
                                      <tr key={generateUniqueKeyForItem(student, index, 'day-student')}>
                                        <td>{student.Documento}</td>
                                        <td>{student['Nombre Completo']}</td>
                                        <td>{student.Edad}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    {!Object.entries(studentsByPoolDayAndShift.Matutino)
                      .some(([day, students]) => day === 'Viernes') && (
                      <Col md={12}>
                        <Alert variant="info">
                          No hay estudiantes asignados al turno matutino para los viernes.
                        </Alert>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Sección Vespertino */}
              <Card>
                <Card.Header className={cardHeaderStyle}>
                  <h5 className="mb-0"><strong>Turno Vespertino</strong></h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {Object.entries(studentsByPoolDayAndShift.Vespertino)
                      .map(([day, dayStudents]) => (
                        <Col md={6} key={`vespertino-${day}`} className="mb-3">
                          <Card>
                            <Card.Header className={cardHeaderWithButtonsStyle} data-component-name="ReportsPage">
                              <h5 className="mb-0"><strong>Vespertino - {day}</strong></h5>
                              <CSVLink
                                data={getCSVData(dayStudents)}
                                filename={`vespertino-${day.toLowerCase()}.csv`}
                                className={exportButtonStyle}
                                separator=";"
                              >
                                Exportar CSV
                              </CSVLink>
                            </Card.Header>
                            <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                              <p className="text-center mb-3">{dayStudents.length}</p>
                              {dayStudents.length === 0 ? (
                                <p className="text-center">No hay estudiantes asignados.</p>
                              ) : (
                                <Table striped bordered hover responsive>
                                  <thead>
                                    <tr>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Documento')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Documento {getSortDirectionIndicator('pool', 'Documento')}
                                      </th>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Nombre Completo')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Nombre Completo {getSortDirectionIndicator('pool', 'Nombre Completo')}
                                      </th>
                                      <th 
                                        className="column-header" 
                                        onClick={() => requestSort('pool', 'Edad')}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        Edad {getSortDirectionIndicator('pool', 'Edad')}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dayStudents.map((student, index) => (
                                      <tr key={generateUniqueKeyForItem(student, index, 'day-student-2')}>
                                        <td>{student.Documento}</td>
                                        <td>{student['Nombre Completo']}</td>
                                        <td>{student.Edad}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    {!Object.entries(studentsByPoolDayAndShift.Vespertino)
                      .some(([day, students]) => students.length > 0) && (
                      <Col md={12}>
                        <Alert variant="info">
                          No hay estudiantes asignados al turno vespertino.
                        </Alert>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Renderizar el reporte por turno
  const renderShiftReport = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className={cardHeaderStyle}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><strong>Turnos</strong></h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {Object.entries(studentsByShift).map(([shift, shiftStudents]) => (
              <Col md={6} key={shift} className="mb-3">
                <Card>
                  <Card.Header className={cardHeaderStyle}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><strong>{shift}</strong></h5>
                      <CSVLink
                        data={getCSVData(shiftStudents)}
                        filename={`${shift.toLowerCase()}.csv`}
                        className={exportButtonStyle}
                        separator=";"
                      >
                        Exportar CSV
                      </CSVLink>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <p className="text-center mb-3">{shiftStudents.length}</p>
                    {shiftStudents.length === 0 ? (
                      <p className="text-center">No hay estudiantes asignados.</p>
                    ) : (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('shift', 'Documento')}
                              style={{ cursor: 'pointer' }}
                            >
                              Documento {getSortDirectionIndicator('shift', 'Documento')}
                            </th>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('shift', 'Nombre Completo')}
                              style={{ cursor: 'pointer' }}
                            >
                              Nombre Completo {getSortDirectionIndicator('shift', 'Nombre Completo')}
                            </th>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('shift', 'Edad')}
                              style={{ cursor: 'pointer' }}
                            >
                              Edad {getSortDirectionIndicator('shift', 'Edad')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftStudents.map((student, index) => (
                            <tr key={generateUniqueKeyForItem(student, index, 'shift-student')}>
                              <td>{student.Documento}</td>
                              <td>{student['Nombre Completo']}</td>
                              <td>{student.Edad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Renderizar el reporte por grupo (antes era por edad)
  const renderGroupReport = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className={cardHeaderStyle}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><strong>Grupos</strong></h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {Object.entries(studentsByGroup).map(([group, groupStudents]) => (
              <Col md={6} key={group} className="mb-3">
                <Card>
                  <Card.Header className={cardHeaderStyle}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><strong>{group}</strong></h5>
                      <CSVLink
                        data={getCSVData(groupStudents)}
                        filename={`grupo-${group.toLowerCase()}.csv`}
                        className={exportButtonStyle}
                        separator=";"
                      >
                        Exportar CSV
                      </CSVLink>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <p className="text-center mb-3">{groupStudents.length}</p>
                    {groupStudents.length === 0 ? (
                      <p className="text-center">No hay estudiantes en este grupo.</p>
                    ) : (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('age', 'Documento')}
                              style={{ cursor: 'pointer' }}
                            >
                              Documento {getSortDirectionIndicator('age', 'Documento')}
                            </th>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('age', 'Nombre Completo')}
                              style={{ cursor: 'pointer' }}
                            >
                              Nombre Completo {getSortDirectionIndicator('age', 'Nombre Completo')}
                            </th>
                            <th 
                              className="column-header" 
                              onClick={() => requestSort('age', 'Edad')}
                              style={{ cursor: 'pointer' }}
                            >
                              Edad {getSortDirectionIndicator('age', 'Edad')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStudents.map((student, index) => (
                            <tr key={generateUniqueKeyForItem(student, index, 'group-student')}>
                              <td>{student.Documento}</td>
                              <td>{student['Nombre Completo']}</td>
                              <td>{student.Edad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // Datos para exportar a CSV
  const getCSVData = (data) => {
    return data.map(student => ({
      Documento: student.Documento || '',
      Nombre: student.Nombre || '',
      Apellido: student.Apellido || '',
      'Nombre Completo': student['Nombre Completo'] || '',
      Edad: student.Edad || '',
      'Fecha de nacimiento': student['Fecha de nacimiento'] || '',
      Sexo: student.Sexo || '',
      Turno: student.Turno || '',
      'Aptitud Fisica': student['Aptitud Fisica'] || '',
      Vacunas: student.Vacunas || '',
      'Dia de Piscina': student['Dia de Piscina'] || ''
    }));
  };

  return (
    <Container>
      <h1 className="mb-4">Reportes</h1>
      
      <style>
        {`
          .column-header {
            cursor: pointer;
            user-select: none;
            position: relative;
            padding-right: 18px;
          }
          .column-header:hover {
            background-color: #f0f0f0;
          }
          .sort-indicator {
            position: absolute;
            right: 5px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 10px;
            color: #666;
          }
        `}
      </style>
      
      <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="expiring">Documentos por Vencer</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="expired">Documentos Vencidos</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pool">Piscina</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="shift">Turnos</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="group">Grupos</Nav.Link>
        </Nav.Item>
      </Nav>
      
      {activeTab === 'expiring' && renderExpiringDocumentsReport()}
      {activeTab === 'expired' && renderExpiredDocumentsReport()}
      {activeTab === 'pool' && renderPoolReport()}
      {activeTab === 'shift' && renderShiftReport()}
      {activeTab === 'group' && renderGroupReport()}
    </Container>
  );
};

export default ReportsPage;
