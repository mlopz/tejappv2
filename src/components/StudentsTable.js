import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Button, Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye, FiMoreVertical, FiCheck } from 'react-icons/fi';

const StudentsTable = ({ data, onEdit, onDelete, onBatchDelete, onReorder, onSelectedChange }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  
  // Referencia para almacenar la última selección enviada al componente padre
  const lastSelectionRef = useRef(null);

  // Actualizar los estudiantes cuando cambian los datos
  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Asegurar que cada estudiante tenga un ID único
      const studentsWithIds = data.map((student, index) => {
        // Usar Documento como ID principal, o un ID generado si no existe
        const id = student.Documento || `student-index-${index}`;
        return {
          ...student,
          id: id
        };
      });
      setStudents(studentsWithIds);
      
      // Limpiar selecciones cuando cambian los datos
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setStudents([]);
    }
  }, [data]);

  // Función para ordenar los datos
  const sortedStudents = React.useMemo(() => {
    let sortableItems = [...students];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Manejar valores nulos o indefinidos
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;
        
        // Comparar valores
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Si son números, convertirlos para comparación numérica
        if (!isNaN(aValue) && !isNaN(bValue)) {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }
        
        // Comparación estándar
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [students, sortConfig]);

  // Manejador para ordenar al hacer clic en el encabezado
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Obtener el indicador de dirección para el encabezado
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 
      <span className="sort-indicator">▲</span> : 
      <span className="sort-indicator">▼</span>;
  };

  // Manejador para seleccionar/deseleccionar todos los estudiantes
  const handleSelectAll = (e) => {
    let newSelected = [];
    
    if (selectAll) {
      // Si ya estaban todos seleccionados, deseleccionamos todos
      newSelected = [];
    } else {
      // Si no estaban todos seleccionados, seleccionamos todos
      newSelected = students.map(student => student.id);
    }
    
    setSelectedStudents(newSelected);
    setSelectAll(!selectAll);
    
    // Notificar al componente padre de forma manual
    if (onSelectedChange) {
      console.log('Notificando cambio en selección (todos):', newSelected);
      onSelectedChange(newSelected);
    }
  };
  
  // Manejador para seleccionar/deseleccionar un estudiante
  const handleSelectStudent = (studentId, checked) => {
    console.log('Seleccionando estudiante con ID:', studentId);
    
    // Verificar que el ID existe
    const studentExists = students.some(student => student.id === studentId);
    if (!studentExists) {
      console.error('Error: Intentando seleccionar un estudiante con ID inexistente:', studentId);
      return;
    }
    
    setSelectedStudents(prevSelected => {
      let newSelected;
      
      if (prevSelected.includes(studentId)) {
        // Si ya estaba seleccionado, lo quitamos
        newSelected = prevSelected.filter(id => id !== studentId);
        setSelectAll(false);
      } else {
        // Si no estaba seleccionado, lo añadimos
        newSelected = [...prevSelected, studentId];
        // Si todos están seleccionados, activamos selectAll
        if (newSelected.length === students.length) {
          setSelectAll(true);
        }
      }
      
      console.log('Estudiantes seleccionados actualizados:', newSelected);
      
      // Notificar al componente padre de forma manual
      // Esto evita el bucle infinito que ocurría con useEffect
      if (onSelectedChange) {
        setTimeout(() => {
          console.log('Notificando cambio en selección (manual):', newSelected);
          onSelectedChange(newSelected);
        }, 0);
      }
      
      return newSelected;
    });
  };

  // Manejar acciones por lotes
  const handleBatchAction = (action) => {
    console.log('Acción por lotes:', action, 'Estudiantes seleccionados:', selectedStudents);
    
    if (action === 'delete' && selectedStudents.length > 0) {
      // Convertir IDs a objetos de estudiante completos
      const selectedStudentObjects = students.filter(student => 
        selectedStudents.includes(student.id)
      );
      
      if (selectedStudentObjects.length === 0) {
        console.error('Error: No se encontraron objetos de estudiante para los IDs seleccionados');
        return;
      }
      
      console.log('Eliminando estudiantes:', selectedStudentObjects);
      
      // Llamar a la función de eliminación por lotes
      if (onBatchDelete) {
        onBatchDelete(selectedStudents);
      }
      
      // Limpiar selección después de eliminar
      setSelectedStudents([]);
      setSelectAll(false);
    }
  };

  // Manejador para la navegación con prevención de eventos predeterminados
  const handleActionClick = (e, action, student) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'edit':
        window.location.href = `/edit-student/${student.Documento}`;
        break;
      case 'delete':
        onDelete(student);
        break;
      case 'view':
        window.location.href = `/student/${student.Documento}`;
        break;
      default:
        break;
    }
  };

  // Si no hay datos, mostrar mensaje
  if (!students || students.length === 0) {
    return <div className="alert alert-info">No hay estudiantes para mostrar</div>;
  }

  return (
    <div className="students-table-container">
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
          .action-icon {
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }
          .action-icon:hover {
            background-color: #f0f0f0;
          }
          .action-edit:hover {
            color: #212529;
          }
          .action-delete:hover {
            color: #212529;
          }
          .action-view:hover {
            color: #212529;
          }
          .selected-row {
            background-color: #f8f9fa !important;
          }
          .batch-actions {
            margin-bottom: 15px;
          }
        `}
      </style>
      
      {selectedStudents.length > 0 && (
        <div className="batch-actions d-flex align-items-center">
          <span className="me-2">
            {selectedStudents.length} estudiante(s) seleccionado(s)
          </span>
          <Button 
            variant="outline-dark" 
            size="sm" 
            className="me-2"
            onClick={() => handleBatchAction('delete')}
          >
            <FiTrash2 className="me-1" /> Eliminar seleccionados
          </Button>
          <Button 
            variant="outline-dark" 
            size="sm"
            onClick={() => {
              setSelectedStudents([]);
              setSelectAll(false);
            }}
          >
            Cancelar selección
          </Button>
        </div>
      )}
      
      <Table striped bordered hover>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <Form.Check 
                type="checkbox" 
                checked={selectAll}
                onChange={handleSelectAll}
                aria-label="Seleccionar todos los estudiantes"
              />
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Documento')}
            >
              Documento {getSortDirectionIndicator('Documento')}
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Nombre Completo')}
            >
              Nombre Completo {getSortDirectionIndicator('Nombre Completo')}
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Edad')}
            >
              Edad {getSortDirectionIndicator('Edad')}
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Sexo')}
            >
              Sexo {getSortDirectionIndicator('Sexo')}
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Turno')}
            >
              Turno {getSortDirectionIndicator('Turno')}
            </th>
            <th 
              className="column-header" 
              onClick={() => requestSort('Fecha de nacimiento')}
            >
              Fecha de Nacimiento {getSortDirectionIndicator('Fecha de nacimiento')}
            </th>
            <th style={{ width: '80px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((student) => (
            <tr 
              key={student.id} 
              className={selectedStudents.includes(student.id) ? 'selected-row' : ''}
              onClick={() => handleSelectStudent(student.id)}
              style={{ cursor: 'pointer' }}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <Form.Check 
                  type="checkbox" 
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleSelectStudent(student.id)}
                  aria-label={`Seleccionar estudiante ${student['Nombre Completo']}`}
                />
              </td>
              <td>{student.Documento}</td>
              <td>{student['Nombre Completo']}</td>
              <td>{student.Edad}</td>
              <td>{student.Sexo}</td>
              <td>{student.Turno}</td>
              <td>{student['Fecha de nacimiento']}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between">
                  <FiEdit 
                    className="action-icon action-edit" 
                    title="Editar"
                    onClick={(e) => handleActionClick(e, 'edit', student)}
                    size={28}
                  />
                  <FiTrash2 
                    className="action-icon action-delete" 
                    title="Eliminar"
                    onClick={(e) => handleActionClick(e, 'delete', student)}
                    size={28}
                  />
                  <FiEye 
                    className="action-icon action-view" 
                    title="Ver detalles"
                    onClick={(e) => handleActionClick(e, 'view', student)}
                    size={28}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="d-flex justify-content-center mt-3">
        <span>Mostrando {students.length} estudiantes</span>
      </div>
    </div>
  );
};

export default StudentsTable;
