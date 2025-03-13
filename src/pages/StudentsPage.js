import React, { useState, useEffect } from 'react';
import { Container, Modal, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import StudentsTable from '../components/StudentsTable';
import FilterPanel from '../components/FilterPanel';
import DataService from '../services/DataService';

const StudentsPage = ({ students = [], onEdit, onDelete, onSelectedChange, onBatchDelete }) => {
  const location = useLocation();
  const [filteredStudents, setFilteredStudents] = useState(students);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState(null);
  const [estudiantesToDelete, setEstudiantesToDelete] = useState([]);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  
  // Aplicamos filtros iniciales si los hay (por ejemplo, al navegar desde la página de inicio)
  useEffect(() => {
    // Asegurarse de que students exista antes de intentar filtrar
    if (Array.isArray(students)) {
      if (location.state?.initialFilter) {
        handleFilter(location.state.initialFilter);
      } else {
        setFilteredStudents(students);
      }
    } else {
      console.log('Esperando datos de estudiantes...');
      setFilteredStudents([]);
    }
  }, [location.state, students]);

  // Función para manejar el filtrado de estudiantes
  const handleFilter = (filters) => {
    // Verificar que students no sea undefined antes de continuar
    if (!students) {
      console.error('students es undefined en handleFilter');
      setFilteredStudents([]);
      return;
    }
    
    // Implementación directa del filtrado para evitar problemas con DataService.filterStudents
    let filtered = [...students]; // Crear una copia para evitar mutaciones
    
    // Aplicamos todos los filtros excepto Activo primero
    if (filters && Object.keys(filters).length > 0) {
      filtered = filtered.filter(estudiante => {
        // Verificamos cada filtro excepto Activo
        return Object.entries(filters).every(([key, value]) => {
          // Si el valor del filtro está vacío, no filtramos por ese campo
          if (value === '' || value === undefined || value === null) return true;
          
          // Saltamos el campo Activo para procesarlo después
          if (key === 'Activo') {
            return true;
          }
          
          // Para el resto de campos, hacemos la comparación normal
          // Verificamos que estudiante[key] exista antes de convertirlo a string
          if (estudiante[key] === undefined || estudiante[key] === null) return false;
          
          // Convertimos ambos a minúsculas para una comparación insensible a mayúsculas
          const estudianteValue = String(estudiante[key]).toLowerCase();
          const filterValue = String(value).toLowerCase();
          
          return estudianteValue.includes(filterValue);
        });
      });
    }
    
    // Ahora aplicamos el filtro de Activo si está presente
    if (filters && filters.Activo === true) {
      filtered = filtered.filter(estudiante => estudiante.Activo !== false);
    }
    
    setFilteredStudents(filtered);
  };

  // Función para manejar la eliminación de un estudiante
  const handleDeleteClick = (estudiante) => {
    console.log('Intentando eliminar estudiante:', estudiante);
    setEstudianteToDelete(estudiante);
    setIsBatchDelete(false);
    setShowDeleteModal(true);
  };

  // Función para manejar la eliminación por lotes
  const handleBatchDeleteClick = (selectedEstudiantes) => {
    if (selectedEstudiantes && selectedEstudiantes.length > 0) {
      console.log('IDs de estudiantes seleccionados para eliminar:', selectedEstudiantes);
      
      // Asegurarse de que cada estudiante tenga un ID para comparar
      const estudiantesWithIds = students.map((estudiante, index) => {
        // Usar Documento como ID principal, o un ID generado si no existe
        const id = estudiante.Documento || `estudiante-index-${index}`;
        return {
          ...estudiante,
          id: id
        };
      });
      
      // Convertir los IDs seleccionados a objetos de estudiante completos
      const estudiantesToDeleteObjects = estudiantesWithIds.filter(estudiante => 
        selectedEstudiantes.includes(estudiante.id)
      );
      
      console.log('Estudiantes a eliminar por lotes:', estudiantesToDeleteObjects);
      setEstudiantesToDelete(estudiantesToDeleteObjects);
      setIsBatchDelete(true);
      setShowDeleteModal(true);
    } else {
      console.log('No hay estudiantes seleccionados para eliminar');
      alert('No hay estudiantes seleccionados para eliminar. Por favor, selecciona al menos un estudiante.');
    }
  };

  // Función para manejar el cambio en los estudiantes seleccionados
  const handleSelectedEstudiantesChange = (selectedEstudiantes) => {
    // Pasar los estudiantes seleccionados al componente padre
    if (onSelectedChange) {
      onSelectedChange(selectedEstudiantes);
    }
  };

  // Función para confirmar la eliminación de estudiantes
  const confirmDelete = () => {
    if (isBatchDelete && estudiantesToDelete.length > 0) {
      console.log('Eliminando por lotes:', estudiantesToDelete.length, 'estudiantes');
      
      // Usar la función de eliminación por lotes en lugar de eliminar uno por uno
      if (onBatchDelete) {
        console.log('Llamando a onBatchDelete con', estudiantesToDelete.length, 'estudiantes');
        console.log('Detalles de estudiantes a eliminar:', estudiantesToDelete.map(e => ({
          documento: e.Documento,
          nombre: e['Nombre Completo'],
          activo: e.Activo
        })));
        onBatchDelete(estudiantesToDelete);
      } else {
        console.log('onBatchDelete no está disponible, eliminando uno por uno');
        // Crear una copia de los estudiantes a eliminar para evitar problemas con el estado
        const estudiantesToDeleteCopy = [...estudiantesToDelete];
        
        // Eliminar cada estudiante uno por uno como fallback
        estudiantesToDeleteCopy.forEach(estudiante => {
          console.log('Eliminando estudiante:', estudiante.Documento, estudiante['Nombre Completo'], 'Activo:', estudiante.Activo);
          onDelete(estudiante);
        });
      }
      
      setShowDeleteModal(false);
      setEstudiantesToDelete([]);
      setIsBatchDelete(false);
    } else if (estudianteToDelete) {
      // Eliminar un solo estudiante
      console.log('Eliminando estudiante individual:', estudianteToDelete.Documento, estudianteToDelete['Nombre Completo'], 'Activo:', estudianteToDelete.Activo);
      onDelete(estudianteToDelete);
      setShowDeleteModal(false);
      setEstudianteToDelete(null);
    }
  };

  // Función para manejar el cambio en el orden de los estudiantes
  const handleReorder = (reorderedEstudiantes) => {
    console.log('Estudiantes reordenados:', reorderedEstudiantes);
    // Guardar el nuevo orden en localStorage
    const updatedEstudiantes = DataService.reorderEstudiantes(students, reorderedEstudiantes);
    setFilteredStudents(reorderedEstudiantes);
  };

  return (
    <Container>
      <h1 className="mb-4">Gestión de Estudiantes</h1>
      
      {/* Panel de filtros */}
      <FilterPanel onFilter={handleFilter} />
      
      {/* Tabla de estudiantes */}
      <StudentsTable 
        data={filteredStudents} 
        onEdit={onEdit} 
        onDelete={handleDeleteClick}
        onBatchDelete={handleBatchDeleteClick}
        onReorder={handleReorder}
        onSelectedChange={handleSelectedEstudiantesChange}
      />
      
      {/* Modal de confirmación para eliminar estudiante(s) */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isBatchDelete ? (
            <>
              ¿Estás seguro de que deseas eliminar a {estudiantesToDelete.length} estudiantes?
              Esta acción no se puede deshacer.
            </>
          ) : (
            <>
              ¿Estás seguro de que deseas eliminar a {estudianteToDelete?.['Nombre Completo']}?
              Esta acción no se puede deshacer.
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentsPage;
