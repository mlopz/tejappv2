import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/monochrome.css';

// Componentes
import AppNavbar from './components/Navbar';
import SIPIFileUploader from './components/SIPIFileUploader';

// Páginas
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import AddStudentPage from './pages/AddStudentPage';
import EditStudentPage from './pages/EditStudentPage';
import ReportsPage from './pages/ReportsPage';
import PoolConfigPage from './pages/PoolConfigPage';
import InactiveStudentsPage from './pages/InactiveStudentsPage';
import MissingDocumentationPage from './pages/MissingDocumentationPage';
import FamiliasPage from './pages/FamiliasPage';
import FamiliaMiembrosPage from './pages/FamiliaMiembrosPage';
import IntervencionesIndividualesPage from './pages/IntervencionesIndividualesPage';
import IntervencionesFamiliaresPage from './pages/IntervencionesFamiliaresPage';
import IntervencionIndividualDetailPage from './pages/IntervencionIndividualDetailPage';
import IntervencionFamiliarDetailPage from './pages/IntervencionFamiliarDetailPage';
import IntervencionesInstitucionesPage from './pages/IntervencionesInstitucionesPage';
import IntervencionInstitucionDetailPage from './pages/IntervencionInstitucionDetailPage';
import AdminPage from './pages/AdminPage';

// Servicios
import DataService from './services/DataService';

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  
  // Estado para el modal de SIPI
  const [showSIPIModal, setShowSIPIModal] = useState(false);
  const [sipiFile, setSipiFile] = useState(null);

  // Cargar datos al iniciar
  useEffect(() => {
    // Inicializar DataService antes de cargar los datos
    DataService.initialize();
    
    // Verificar si Firebase está habilitado
    const isFirebaseEnabled = DataService.USE_FIREBASE;
    setFirebaseEnabled(isFirebaseEnabled);
    
    // Cargar datos de estudiantes
    DataService.loadCSVData()
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Por favor, importa un archivo CSV.');
        setLoading(false);
      });
  }, []);

  // Función para agregar un nuevo estudiante
  const handleAddStudent = (newStudent) => {
    const updatedStudents = DataService.addStudent(students, newStudent);
    setStudents(updatedStudents);
  };

  // Función para actualizar un estudiante existente
  const handleUpdateStudent = (updatedStudent) => {
    const updatedStudents = DataService.updateStudent(students, updatedStudent);
    setStudents(updatedStudents);
  };

  // Función para eliminar un estudiante
  const handleDeleteStudent = (studentToDelete) => {
    const updatedStudents = DataService.deleteStudent(students, studentToDelete);
    setStudents(updatedStudents);
  };

  // Función para eliminar varios estudiantes en lote
  const handleBatchDeleteStudents = (studentsToDelete) => {
    console.log('Eliminando en lote:', studentsToDelete.length, 'estudiantes');
    const updatedStudents = DataService.deleteMultipleStudents(students, studentsToDelete);
    setStudents(updatedStudents);
  };

  // Función para importar un archivo CSV o SIPI (XLS/XLSX)
  const handleImportCSV = (file) => {
    // Determinar el tipo de archivo por su extensión
    const fileName = file.name.toLowerCase();
    
    // Si es un archivo Excel (XLS/XLSX), mostrar el modal de SIPI para confirmar los cambios
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      console.log('Procesando archivo SIPI:', file.name);
      
      // Mostrar el modal de SIPI
      setSipiFile(file);
      setShowSIPIModal(true);
      
      return;
    }
    
    // Si es un archivo CSV, procesarlo normalmente
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      
      // Parseamos el CSV con PapaParse
      DataService.parseCSV(csvText)
        .then(data => {
          // Los datos ya se guardan en localStorage dentro de parseCSV
          setStudents(data);
        })
        .catch(err => {
          console.error('Error al parsear el CSV:', err);
          setError('No se pudo importar el archivo CSV. Verifica el formato.');
        });
    };
    reader.readAsText(file);
  };

  // Función para actualizar los estudiantes seleccionados
  const handleSelectedStudentsChange = (selected) => {
    setSelectedStudents(selected);
  };

  // Mostrar mensaje de carga
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando datos...</p>
        </div>
      </Container>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button className="btn btn-primary" onClick={() => DataService.loadCSVData().then(data => setStudents(data)).catch(err => console.error(err))}>
            Reintentar
          </button>
        </div>
      </Container>
    );
  }

  console.log('App: Renderizando aplicación con', students.length, 'estudiantes');

  return (
    <Router>
      <div className="App">
        <AppNavbar 
          data={students} 
          onImport={handleImportCSV} 
          selectedStudents={selectedStudents}
        />
        <Container className="mt-4 mb-5">
          <Routes>
            <Route path="/" element={<HomePage students={students} />} />
            <Route 
              path="/students" 
              element={
                <StudentsPage 
                  students={students} 
                  onEdit={handleUpdateStudent} 
                  onDelete={handleDeleteStudent}
                  onBatchDelete={handleBatchDeleteStudents}
                  onSelectedChange={handleSelectedStudentsChange}
                />
              } 
            />
            <Route 
              path="/student/:id" 
              element={<StudentDetailPage students={students} />} 
            />
            <Route 
              path="/add-student" 
              element={<AddStudentPage onAddStudent={handleAddStudent} />} 
            />
            <Route 
              path="/edit-student/:id" 
              element={
                <EditStudentPage 
                  students={students} 
                  onUpdateStudent={handleUpdateStudent} 
                />
              } 
            />
            <Route 
              path="/reports" 
              element={<ReportsPage students={students} />} 
            />
            <Route 
              path="/reports/expiring" 
              element={<ReportsPage students={students} />} 
            />
            <Route 
              path="/pool-config" 
              element={<PoolConfigPage students={students} />} 
            />
            <Route 
              path="/inactive-students" 
              element={<InactiveStudentsPage />} 
            />
            <Route 
              path="/missing-documentation" 
              element={<MissingDocumentationPage />} 
            />
            
            {/* Nuevas rutas para familias e intervenciones */}
            <Route path="/familias" element={<FamiliasPage />} />
            <Route path="/familias/:id/miembros" element={<FamiliaMiembrosPage />} />
            <Route path="/intervenciones/individuales" element={<IntervencionesIndividualesPage />} />
            <Route path="/intervenciones/familiares" element={<IntervencionesFamiliaresPage />} />
            <Route path="/intervenciones/instituciones" element={<IntervencionesInstitucionesPage />} />
            <Route path="/intervenciones/individual/:id" element={<IntervencionIndividualDetailPage />} />
            <Route path="/intervenciones/familiar/:id" element={<IntervencionFamiliarDetailPage />} />
            <Route path="/intervenciones/instituciones/:id" element={<IntervencionInstitucionDetailPage />} />
            <Route path="/estudiantes/:documentoEstudiante/intervenciones" element={<IntervencionesIndividualesPage />} />
            <Route path="/familias/:familiaId/intervenciones" element={<IntervencionesFamiliaresPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Container>
        <footer className="bg-dark text-white text-center py-3">
          <p className="mb-0">Tejanitos &copy; {new Date().getFullYear()}</p>
        </footer>
        {showSIPIModal && (
          <SIPIFileUploader 
            show={true} 
            onHide={() => setShowSIPIModal(false)}
            onFileProcessed={(updatedStudents) => {
              if (updatedStudents) {
                setStudents(updatedStudents);
              }
              setShowSIPIModal(false);
            }}
            students={students}
            file={sipiFile}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
