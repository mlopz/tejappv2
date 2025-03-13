import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import FirebaseService from '../firebase/firebaseService';
import SyncService from './SyncService';

class DataService {
  // Claves para localStorage
  static STORAGE_KEY = 'tejanitos_students_data';
  static FIREBASE_CONFIG_KEY = 'firebase_config';
  static USE_FIREBASE_KEY = 'use_firebase';
  
  // Estado de Firebase (por defecto activado)
  static USE_FIREBASE = true;
  
  // Inicializar el servicio
  static initialize() {
    // Establecer Firebase como activado por defecto
    this.USE_FIREBASE = true;
    localStorage.setItem(this.USE_FIREBASE_KEY, 'true');
    
    // Guardar la configuración de Firebase proporcionada
    const firebaseConfig = {
      apiKey: "AIzaSyDkhsHWP4Crb9e-rkRCjK47ALwukLjKxi0",
      authDomain: "tejapp-4b84d.firebaseapp.com",
      projectId: "tejapp-4b84d",
      storageBucket: "tejapp-4b84d.firebasestorage.app",
      messagingSenderId: "743592538012",
      appId: "1:743592538012:web:a458f74ebd172e4c1fa259",
      measurementId: "G-VK9DM1XJ0F"
    };
    localStorage.setItem(this.FIREBASE_CONFIG_KEY, JSON.stringify(firebaseConfig));
    
    // Inicializar el servicio de sincronización
    SyncService.initialize();
  }
  
  // Configurar el uso de Firebase
  static setUseFirebase(useFirebase) {
    this.USE_FIREBASE = useFirebase;
    localStorage.setItem(this.USE_FIREBASE_KEY, useFirebase.toString());
    console.log('Estado de Firebase actualizado:', useFirebase);
  }

  // Función para cargar datos, primero intenta desde Firebase, luego localStorage, finalmente desde CSV
  static loadCSVData(includeInactive = false) {
    return new Promise((resolve, reject) => {
      // Si Firebase está habilitado, intentamos cargar desde allí primero
      if (this.USE_FIREBASE) {
        FirebaseService.getAllStudents()
          .then(students => {
            if (students && students.length > 0) {
              console.log('Datos cargados desde Firebase, registros:', students.length);
              // Guardamos en localStorage como respaldo
              this.saveDataToLocalStorage(students);
              
              // Filtramos estudiantes inactivos si es necesario
              const filteredStudents = includeInactive ? students : students.filter(student => student.Activo !== false);
              console.log(`Filtrando estudiantes inactivos: ${students.length - filteredStudents.length} estudiantes filtrados`);
              
              resolve(filteredStudents);
              return;
            } else {
              console.log('No hay datos en Firebase, intentando localStorage...');
              this.loadFromLocalStorageOrCSV(resolve, reject, includeInactive);
            }
          })
          .catch(error => {
            console.error('Error al cargar datos desde Firebase:', error);
            console.log('Intentando cargar desde localStorage...');
            this.loadFromLocalStorageOrCSV(resolve, reject, includeInactive);
          });
      } else {
        // Si Firebase no está habilitado, cargamos desde localStorage o CSV
        this.loadFromLocalStorageOrCSV(resolve, reject, includeInactive);
      }
    });
  }
  
  // Función auxiliar para cargar desde localStorage o CSV
  static loadFromLocalStorageOrCSV(resolve, reject, includeInactive = false) {
    // Intentamos cargar desde localStorage
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Datos cargados desde localStorage, registros:', parsedData.length);
        
        // Filtramos estudiantes inactivos si es necesario
        const filteredData = includeInactive ? parsedData : parsedData.filter(student => student.Activo !== false);
        console.log(`Filtrando estudiantes inactivos: ${parsedData.length - filteredData.length} estudiantes filtrados`);
        
        resolve(filteredData);
        return;
      } catch (error) {
        console.warn('Error al parsear datos de localStorage:', error);
        // Si hay error, continuamos con la carga desde CSV
      }
    }

    // Si no hay datos en localStorage, cargamos desde CSV
    fetch('/Database.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el archivo CSV');
        }
        return response.text();
      })
      .then(csvText => {
        console.log('CSV cargado correctamente, longitud:', csvText.length);
        // Parseamos el CSV con PapaParse
        Papa.parse(csvText, {
          header: true,
          delimiter: ';', // Especificamos el delimitador como punto y coma
          skipEmptyLines: true,
          complete: (results) => {
            console.log('Datos parseados correctamente, registros:', results.data.length);
            // Guardamos en localStorage y Firebase para futuras cargas
            this.saveData(results.data);
            
            // Filtramos estudiantes inactivos si es necesario
            const filteredData = includeInactive ? results.data : results.data.filter(student => student.Activo !== false);
            console.log(`Filtrando estudiantes inactivos: ${results.data.length - filteredData.length} estudiantes filtrados`);
            
            resolve(filteredData);
          },
          error: (error) => {
            console.error('Error al parsear CSV:', error);
            reject(error);
          }
        });
      })
      .catch(error => {
        console.error('Error al cargar CSV:', error);
        reject(error);
      });
  }
  
  // Guardar datos en localStorage y Firebase
  static saveData(data) {
    // Guardar en localStorage
    this.saveDataToLocalStorage(data);
    
    // Si Firebase está habilitado, guardar también allí
    if (this.USE_FIREBASE) {
      this.saveDataToFirebase(data);
    }
    
    return data;
  }
  
  // Guardar datos solo en localStorage
  static saveDataToLocalStorage(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('Datos guardados en localStorage, registros:', data.length);
    } catch (error) {
      console.error('Error al guardar datos en localStorage:', error);
    }
  }
  
  // Obtener datos de estudiantes desde localStorage
  static getData() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData;
      }
    } catch (error) {
      console.error('Error al obtener datos de localStorage:', error);
    }
    return [];
  }
  
  // Guardar datos en Firebase
  static saveDataToFirebase(data) {
    try {
      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.log('Sin conexión a internet, guardando operación para sincronización posterior');
        SyncService.addPendingOperation(SyncService.OPERATION_TYPES.IMPORT, data);
        return;
      }
      
      // Importar los datos a Firebase
      FirebaseService.importStudents(data)
        .then(result => {
          console.log('Datos guardados en Firebase, registros:', result.count);
        })
        .catch(error => {
          console.error('Error al guardar datos en Firebase:', error);
          // Si hay error, guardar operación para sincronización posterior
          SyncService.addPendingOperation(SyncService.OPERATION_TYPES.IMPORT, data);
        });
    } catch (error) {
      console.error('Error al preparar datos para Firebase:', error);
      // Si hay error, guardar operación para sincronización posterior
      SyncService.addPendingOperation(SyncService.OPERATION_TYPES.IMPORT, data);
    }
  }

  // Obtener un estudiante por su ID
  static async getStudentById(id) {
    try {
      // Primero intentamos cargar todos los estudiantes
      const allStudents = await this.loadCSVData(true); // Incluir inactivos también
      
      // Buscar el estudiante por ID o Documento
      const student = allStudents.find(student => 
        student.id === id || 
        student.Documento === id || 
        String(student.Documento) === String(id)
      );
      
      if (student) {
        return student;
      }
      
      // Si no se encuentra, intentar buscar en Firebase directamente si está habilitado
      if (this.USE_FIREBASE) {
        try {
          // Intentar buscar por ID de documento en Firebase
          const firebaseStudent = await FirebaseService.getStudentByDocumento(id);
          if (firebaseStudent) {
            return firebaseStudent;
          }
        } catch (firebaseError) {
          console.warn('No se pudo encontrar el estudiante en Firebase:', firebaseError);
        }
      }
      
      // Si llegamos aquí, no se encontró el estudiante
      return null;
    } catch (error) {
      console.error('Error al obtener estudiante por ID:', error);
      throw error;
    }
  }

  // Función para actualizar un estudiante
  static updateStudent(studentsOrId, updatedStudent) {
    // Verificar si el primer parámetro es un ID (string) o un array de estudiantes
    if (typeof studentsOrId === 'string') {
      // Caso: updateStudent(id, updatedStudent)
      const id = studentsOrId;
      
      // Obtener los estudiantes actuales
      const students = this.getData();
      
      if (!Array.isArray(students)) {
        console.error('Error: No se pudieron obtener los estudiantes');
        return null;
      }
      
      // Buscar el estudiante por ID en los datos locales
      const existingStudentIndex = students.findIndex(s => s.Documento === id);
      
      if (existingStudentIndex === -1) {
        console.error(`Error: No se encontró estudiante con ID ${id}`);
        return null;
      }
      
      // Actualizar el estudiante en el array
      const updatedStudents = [...students];
      updatedStudents[existingStudentIndex] = {
        ...updatedStudents[existingStudentIndex],
        ...updatedStudent
      };
      
      // Guardar en localStorage
      this.saveData(updatedStudents);
      
      // Actualizar en Firebase si está habilitado
      if (this.USE_FIREBASE) {
        this.updateStudentInFirebase(id, updatedStudent);
      }
      
      return updatedStudents;
    } else {
      // Caso original: updateStudent(students, updatedStudent)
      let students = studentsOrId;
      
      // Verificar que students sea un array
      if (!Array.isArray(students)) {
        console.error('Error: students no es un array', students);
        // Obtener los estudiantes del localStorage si students no es un array
        students = this.getData();
        
        // Si aún no es un array, inicializar como array vacío
        if (!Array.isArray(students)) {
          console.warn('No se pudieron recuperar los estudiantes, inicializando como array vacío');
          students = [];
        }
      }
      
      const updatedStudents = students.map(student => 
        student.Documento === updatedStudent.Documento ? updatedStudent : student
      );
      
      // Guardar en localStorage
      this.saveData(updatedStudents);
      
      // Actualizar en Firebase si está habilitado
      if (this.USE_FIREBASE) {
        this.updateStudentInFirebase(updatedStudent.Documento, updatedStudent);
      }
      
      return updatedStudents;
    }
  }
  
  // Método auxiliar para actualizar un estudiante en Firebase
  static updateStudentInFirebase(documentoId, updatedStudent) {
    // Verificar si hay conexión a internet
    if (!navigator.onLine) {
      console.log('Sin conexión a internet, guardando operación para sincronización posterior');
      SyncService.addPendingOperation(SyncService.OPERATION_TYPES.UPDATE, updatedStudent);
      return;
    }
    
    // Buscar si el estudiante ya existe en Firebase por su documento
    FirebaseService.getStudentByDocumento(documentoId)
      .then(existingStudent => {
        if (existingStudent) {
          // Si existe, actualizarlo
          FirebaseService.updateStudent(existingStudent.id, updatedStudent)
            .then(() => console.log('Estudiante actualizado en Firebase'))
            .catch(error => {
              console.error('Error al actualizar estudiante en Firebase:', error);
              // Si hay error, guardar operación para sincronización posterior
              SyncService.addPendingOperation(SyncService.OPERATION_TYPES.UPDATE, updatedStudent);
            });
        } else {
          // Si no existe, agregarlo
          FirebaseService.addStudent(updatedStudent)
            .then(() => console.log('Estudiante agregado a Firebase'))
            .catch(error => {
              console.error('Error al agregar estudiante a Firebase:', error);
              // Si hay error, guardar operación para sincronización posterior
              SyncService.addPendingOperation(SyncService.OPERATION_TYPES.UPDATE, updatedStudent);
            });
        }
      })
      .catch(error => {
        console.error('Error al buscar estudiante en Firebase:', error);
        // Si hay error, guardar operación para sincronización posterior
        SyncService.addPendingOperation(SyncService.OPERATION_TYPES.UPDATE, updatedStudent);
      });
  }

  // Función para añadir un nuevo estudiante
  static addStudent(students, newStudent) {
    const updatedStudents = [...students, newStudent];
    
    // Guardar en localStorage y Firebase
    this.saveData(updatedStudents);
    
    // Si Firebase está habilitado, agregar el estudiante a Firebase
    if (this.USE_FIREBASE) {
      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.log('Sin conexión a internet, guardando operación para sincronización posterior');
        SyncService.addPendingOperation(SyncService.OPERATION_TYPES.ADD, newStudent);
        return updatedStudents;
      }
      
      FirebaseService.addStudent(newStudent)
        .then(() => console.log('Nuevo estudiante agregado a Firebase'))
        .catch(error => {
          console.error('Error al agregar estudiante a Firebase:', error);
          // Si hay error, guardar operación para sincronización posterior
          SyncService.addPendingOperation(SyncService.OPERATION_TYPES.ADD, newStudent);
        });
    }
    
    return updatedStudents;
  }

  // Función para eliminar un estudiante
  static deleteStudent(students, studentToDelete) {
    console.log('DataService.deleteStudent - Estudiante a eliminar:', studentToDelete);
    
    // Verificar que el estudiante a eliminar tenga un documento válido
    if (!studentToDelete || !studentToDelete.Documento) {
      console.error('Error: Intento de eliminar un estudiante sin documento válido', studentToDelete);
      return students;
    }
    
    // Verificar si el estudiante está activo o inactivo
    const isActive = studentToDelete.Activo !== false;
    console.log(`El estudiante con documento ${studentToDelete.Documento} está ${isActive ? 'activo' : 'inactivo'}`);
    
    // Filtrar el estudiante de la lista, independientemente de su estado activo/inactivo
    const updatedStudents = students.filter(student => 
      student.Documento !== studentToDelete.Documento
    );
    
    console.log(`Estudiante con documento ${studentToDelete.Documento} eliminado correctamente. Estudiantes restantes: ${updatedStudents.length}`);
    
    // Guardar en localStorage y Firebase
    this.saveData(updatedStudents);
    
    // Si Firebase está habilitado, eliminar el estudiante de Firebase
    if (this.USE_FIREBASE) {
      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.log('Sin conexión a internet, guardando operación para sincronización posterior');
        SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
        return updatedStudents;
      }
      
      if (isActive) {
        // Si el estudiante está activo, moverlo a la colección de inactivos
        console.log(`Moviendo estudiante activo con documento ${studentToDelete.Documento} a inactivos en Firebase`);
        
        // Buscar si el estudiante ya existe en Firebase por su documento
        FirebaseService.getStudentByDocumento(studentToDelete.Documento)
          .then(existingStudent => {
            if (existingStudent) {
              // Si existe, eliminarlo de la colección de activos y moverlo a inactivos
              FirebaseService.deleteStudent(existingStudent.id)
                .then(() => {
                  console.log(`Estudiante con documento ${studentToDelete.Documento} eliminado de activos en Firebase`);
                  
                  // Preparar el estudiante para la colección de inactivos
                  const inactiveStudent = {
                    ...studentToDelete,
                    Activo: false,
                    inactivationReason: 'deleted_by_user',
                    inactivationDate: new Date().toISOString()
                  };
                  
                  // Añadir a la colección de inactivos
                  FirebaseService.addInactiveStudent(inactiveStudent)
                    .then(() => console.log(`Estudiante con documento ${studentToDelete.Documento} añadido a inactivos en Firebase`))
                    .catch(error => {
                      console.error(`Error al añadir estudiante con documento ${studentToDelete.Documento} a inactivos en Firebase:`, error);
                      // Si hay error, guardar operación para sincronización posterior
                      SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
                    });
                })
                .catch(error => {
                  console.error(`Error al eliminar estudiante con documento ${studentToDelete.Documento} de activos en Firebase:`, error);
                  // Si hay error, guardar operación para sincronización posterior
                  SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
                });
            } else {
              console.log(`No se encontró el estudiante con documento ${studentToDelete.Documento} en activos de Firebase`);
            }
          })
          .catch(error => {
            console.error(`Error al buscar estudiante con documento ${studentToDelete.Documento} en Firebase:`, error);
            // Si hay error, guardar operación para sincronización posterior
            SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
          });
      } else {
        // Si el estudiante ya está inactivo, eliminarlo permanentemente
        console.log(`Eliminando permanentemente estudiante inactivo con documento ${studentToDelete.Documento} de Firebase`);
        
        // Buscar en la colección de inactivos por documento
        FirebaseService.getInactiveStudentByDocumento(studentToDelete.Documento)
          .then(inactiveStudent => {
            if (inactiveStudent) {
              // Si existe, eliminarlo permanentemente
              FirebaseService.deleteInactiveStudentPermanently(inactiveStudent.id)
                .then(() => console.log(`Estudiante inactivo con documento ${studentToDelete.Documento} eliminado permanentemente de Firebase`))
                .catch(error => {
                  console.error(`Error al eliminar permanentemente estudiante inactivo con documento ${studentToDelete.Documento} de Firebase:`, error);
                  // Si hay error, guardar operación para sincronización posterior
                  SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
                });
            } else {
              console.log(`No se encontró el estudiante inactivo con documento ${studentToDelete.Documento} en Firebase`);
            }
          })
          .catch(error => {
            console.error(`Error al buscar estudiante inactivo con documento ${studentToDelete.Documento} en Firebase:`, error);
            // Si hay error, guardar operación para sincronización posterior
            SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, studentToDelete);
          });
      }
    }
    
    return updatedStudents;
  }

  // Función para eliminar varios estudiantes
  static deleteMultipleStudents(students, studentsToDelete) {
    console.log('DataService.deleteMultipleStudents - Estudiantes a eliminar:', studentsToDelete.length);
    
    // Verificar que haya estudiantes para eliminar
    if (!studentsToDelete || studentsToDelete.length === 0) {
      console.error('Error: No hay estudiantes para eliminar en lote');
      return students;
    }
    
    // Separar estudiantes activos e inactivos
    const activeStudents = [];
    const inactiveStudents = [];
    
    studentsToDelete.forEach(student => {
      if (!student.Documento) {
        console.warn('Advertencia: Estudiante sin documento en lote de eliminación', student);
        return;
      }
      
      if (student.Activo === false) {
        console.log(`Estudiante con documento ${student.Documento} es inactivo`);
        inactiveStudents.push(student);
      } else {
        console.log(`Estudiante con documento ${student.Documento} es activo`);
        activeStudents.push(student);
      }
    });
    
    console.log(`Total: ${studentsToDelete.length}, Activos: ${activeStudents.length}, Inactivos: ${inactiveStudents.length}`);
    
    // Extraer los documentos de los estudiantes a eliminar
    const documentsToDelete = studentsToDelete.map(student => {
      if (!student.Documento) {
        console.warn('Advertencia: Estudiante sin documento en lote de eliminación', student);
        return null;
      }
      return student.Documento;
    }).filter(doc => doc !== null); // Filtrar documentos nulos
    
    console.log('Documentos a eliminar:', documentsToDelete);
    
    // Filtrar los estudiantes que no están en la lista de eliminación
    const updatedStudents = students.filter(student => 
      !documentsToDelete.includes(student.Documento)
    );
    
    console.log(`Se eliminaron ${documentsToDelete.length} estudiantes. Estudiantes restantes: ${updatedStudents.length}`);
    
    // Guardar en localStorage y Firebase
    this.saveData(updatedStudents);
    
    // Si Firebase está habilitado, eliminar los estudiantes de Firebase
    if (this.USE_FIREBASE) {
      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.log('Sin conexión a internet, guardando operaciones para sincronización posterior');
        // Guardar cada estudiante a eliminar como una operación pendiente
        studentsToDelete.forEach(student => {
          if (student.Documento) {
            SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, student);
          }
        });
        return updatedStudents;
      }
      
      // Para cada estudiante a eliminar
      studentsToDelete.forEach(student => {
        if (!student.Documento) {
          console.warn('Advertencia: Estudiante sin documento, no se puede eliminar de Firebase', student);
          return;
        }
        
        // Buscar si el estudiante ya existe en Firebase por su documento
        FirebaseService.getStudentByDocumento(student.Documento)
          .then(existingStudent => {
            if (existingStudent) {
              // Si existe, eliminarlo
              FirebaseService.deleteStudent(existingStudent.id)
                .then(() => console.log(`Estudiante con documento ${student.Documento} eliminado de Firebase`))
                .catch(error => {
                  console.error(`Error al eliminar estudiante con documento ${student.Documento} de Firebase:`, error);
                  // Si hay error, guardar operación para sincronización posterior
                  SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, student);
                });
            } else {
              console.log(`No se encontró el estudiante con documento ${student.Documento} en Firebase`);
            }
          })
          .catch(error => {
            console.error(`Error al buscar estudiante con documento ${student.Documento} en Firebase:`, error);
            // Si hay error, guardar operación para sincronización posterior
            SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, student);
          });
      });
    }
    
    return updatedStudents;
  }

  // Función para reordenar estudiantes
  static reorderStudents(students, reorderedStudents) {
    // Guardar en localStorage y Firebase
    this.saveData(reorderedStudents);
    
    // No es necesario hacer nada especial con Firebase aquí, ya que saveData ya guarda en Firebase
    
    return reorderedStudents;
  }

  // Función para parsear texto CSV
  static parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        delimiter: ';', // Especificamos el delimitador como punto y coma
        skipEmptyLines: true,
        complete: (results) => {
          // Guardamos los nuevos datos en localStorage
          this.saveData(results.data);
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  // Función para filtrar estudiantes según criterios
  static filterStudents(students, filters) {
    // Primero filtramos por el campo Activo si está presente en los filtros
    let filteredStudents = students;
    
    if (filters && filters.Activo === true) {
      filteredStudents = students.filter(student => student.Activo !== false);
    }
    
    // Luego aplicamos el resto de los filtros
    return filteredStudents.filter(student => {
      // Si no hay filtros, devolvemos todos los estudiantes
      if (!filters || Object.keys(filters).length === 0) {
        return true;
      }

      // Verificamos cada filtro
      return Object.entries(filters).every(([key, value]) => {
        // Si el valor del filtro está vacío, no filtramos por ese campo
        if (value === '' || value === undefined || value === null) return true;
        
        // Saltamos el campo Activo ya que lo procesamos por separado
        if (key === 'Activo') {
          return true;
        }
        
        // Para el resto de campos, hacemos la comparación normal
        // Convertimos ambos a minúsculas para una comparación insensible a mayúsculas
        const studentValue = (student[key] || '').toString().toLowerCase();
        const filterValue = value.toString().toLowerCase();
        
        return studentValue.includes(filterValue);
      });
    });
  }

  // Función para obtener un estudiante por su documento
  static getStudentByDocument(students, document) {
    return students.find(student => student.Documento === document);
  }

  // Función para exportar los datos a CSV
  static exportToCSV(data) {
    const csv = Papa.unparse(data, {
      delimiter: ';',
      header: true
    });
    
    return csv;
  }

  // Función para exportar a Excel (XLSX) usando la biblioteca xlsx
  static exportToExcel(data) {
    // Crear un libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Convertir los datos a una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Añadir la hoja de cálculo al libro de trabajo
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tejanitos");
    
    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Crear un Blob con el buffer
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  // Función para exportar a JSON
  static exportToJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  // Función para actualizar la fecha de Aptitud Física de múltiples estudiantes
  static updateMultipleAptitudFisica(students, documentIds, datesByStudent) {
    const updatedStudents = students.map(student => {
      if (documentIds.includes(student.Documento) && datesByStudent[student.Documento]) {
        return { ...student, 'Aptitud Fisica': datesByStudent[student.Documento] };
      }
      return student;
    });
    
    // Guardar en localStorage y Firebase
    this.saveData(updatedStudents);
    
    // Si Firebase está habilitado, actualizar los estudiantes en Firebase
    if (this.USE_FIREBASE) {
      // Para cada estudiante actualizado
      documentIds.forEach(docId => {
        if (datesByStudent[docId]) {
          // Buscar el estudiante en Firebase
          FirebaseService.getStudentByDocumento(docId)
            .then(existingStudent => {
              if (existingStudent) {
                // Si existe, actualizarlo
                const updatedData = { 'Aptitud Fisica': datesByStudent[docId] };
                FirebaseService.updateStudent(existingStudent.id, { ...existingStudent, ...updatedData })
                  .then(() => console.log('Aptitud Física actualizada en Firebase para estudiante:', docId))
                  .catch(error => console.error('Error al actualizar Aptitud Física en Firebase:', error));
              }
            })
            .catch(error => console.error('Error al buscar estudiante en Firebase:', error));
        }
      });
    }
    
    return updatedStudents;
  }

  // Función para procesar archivo SIPI XLS y actualizar la base de datos
  static async processSIPIFile(file, currentStudents, applyChanges = true) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          
          // Verificar si es un archivo Excel
          if (!data.startsWith('data:application/vnd.ms-excel') && 
              !data.startsWith('data:application/vnd.openxmlformats-officedocument')) {
            throw new Error('El archivo no es un archivo Excel válido');
          }
          
          // Convertir a array de bytes
          const binary = atob(data.split(',')[1]);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const bytes = new Uint8Array(array);
          
          // Leer el archivo Excel
          const workbook = XLSX.read(bytes, { type: 'array' });
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON usando el rango específico B12:Y100
          // Nota: en XLSX, las celdas se indexan desde 0, pero el formato de rango usa letras para columnas
          // y números para filas, por lo que B12:Y100 significa columnas B-Y (1-24) y filas 12-100
          const range = {s: {c: 1, r: 11}, e: {c: 24, r: 99}}; // B12:Y100 (0-indexed)
          
          // Usar la fila 12 (índice 11) como encabezados
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            range: range
          });
          
          console.log('Datos extraídos del rango B12:Y100:', jsonData);
          
          // Procesar los datos del archivo SIPI
          const processedData = this.processSIPIDataWithFixedStructure(jsonData, currentStudents);
          console.log('Datos procesados del archivo SIPI:', processedData.length, 'estudiantes');
          
          // Detectar cambios
          const changes = this.detectSIPIChanges(processedData, currentStudents);
          console.log('Cambios detectados:', changes);
          
          // Si se solicita aplicar los cambios, hacerlo
          if (applyChanges) {
            const result = await this.applySIPIChanges(changes.changedStudents, currentStudents, changes.missingStudents, changes.newStudents, changes.reactivatedStudents);
            resolve(result);
          } else {
            // Devolver los cambios detectados
            resolve(changes);
          }
        } catch (error) {
          console.error('Error al procesar archivo SIPI:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  // Función para procesar los datos del archivo SIPI con estructura fija
  static processSIPIDataWithFixedStructure(jsonData, currentStudents) {
    const processedData = [];
    
    console.log('Procesando archivo SIPI con estructura fija, filas totales:', jsonData.length);
    
    // Índices específicos proporcionados por el usuario
    // Nota: Los índices en JavaScript comienzan en 0, así que restamos 1 a los valores proporcionados
    const fixedIndices = {
      codigo: 0,         // Columna 1 (SIPI)
      nombre: 4,         // Columna 5 (Nombre completo)
      sexo: 8,           // Columna 9 (Sexo)
      documento: 15,     // Columna 16 (Documento)
      fechaNacimiento: 18 // Columna 19 (Fecha de nacimiento)
    };
    
    console.log('Usando índices específicos para las columnas:');
    console.log('Código (SIPI):', fixedIndices.codigo + 1);
    console.log('Nombre:', fixedIndices.nombre + 1);
    console.log('Sexo:', fixedIndices.sexo + 1);
    console.log('Documento:', fixedIndices.documento + 1);
    console.log('Fecha Nacimiento:', fixedIndices.fechaNacimiento + 1);
    
    // Verificar si hay datos en la primera fila (encabezados)
    if (jsonData.length > 0) {
      console.log('Primera fila (encabezados):', jsonData[0]);
    }
    
    // Procesar las filas de datos (saltando la fila de encabezados)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Verificar si es una fila de datos válida (tiene código y nombre)
      if (row && row[fixedIndices.codigo] && row[fixedIndices.nombre]) {
        try {
          // Extraer solo los datos específicos que necesitamos
          const studentData = {
            Codigo: row[fixedIndices.codigo]?.toString() || '',
            'Nombre Completo': this.formatNombreCompleto(row[fixedIndices.nombre]?.toString() || ''),
            Sexo: row[fixedIndices.sexo]?.toString() || '',
            Documento: row[fixedIndices.documento]?.toString() || '',
            FechaNacimiento: row[fixedIndices.fechaNacimiento] 
              ? this.excelDateToString(row[fixedIndices.fechaNacimiento]) 
              : ''
          };
          
          console.log(`Fila ${i} - Datos extraídos:`, studentData);
          
          // Validar el documento
          if (!studentData.Documento) {
            console.log('Estudiante sin documento, intentando extraer de otros campos:', studentData['Nombre Completo']);
            // Intentar extraer el documento del nombre o de otros campos
            studentData.Documento = this.extractDocumentFromData(studentData, row);
          }
          
          // Normalizar el documento (eliminar espacios, guiones, etc.)
          if (studentData.Documento) {
            studentData.Documento = this.normalizeDocument(studentData.Documento);
            console.log('Documento normalizado:', studentData.Documento);
          }
          
          // Solo procesar estudiantes con documento válido
          if (studentData.Documento && studentData.Documento.length > 5) {
            processedData.push(studentData);
          } else {
            console.warn('Estudiante sin documento válido:', studentData['Nombre Completo']);
          }
        } catch (error) {
          console.error('Error al procesar fila del archivo SIPI:', error, row);
          // Continuar con la siguiente fila
        }
      } else if (row) {
        console.warn(`Fila ${i} - Datos incompletos:`, {
          codigo: row[fixedIndices.codigo],
          nombre: row[fixedIndices.nombre]
        });
      }
    }
    
    console.log('Total de estudiantes procesados:', processedData.length);
    if (processedData.length > 0) {
      console.log('Muestra de datos procesados:', processedData.slice(0, 3));
    }
    
    return processedData;
  }

  // Función para aplicar los cambios confirmados del archivo SIPI
  static async applySIPIChanges(changedStudents, currentStudents, missingStudents, newStudents, reactivatedStudents = []) {
    console.log('Aplicando cambios de SIPI a la base de datos');
    
    try {
      // Validar parámetros
      if (!Array.isArray(changedStudents)) {
        console.error('Error: changedStudents no es un array válido', changedStudents);
        throw new Error('Los estudiantes a actualizar no tienen un formato válido');
      }
      
      if (!Array.isArray(currentStudents)) {
        console.error('Error: currentStudents no es un array válido', currentStudents);
        throw new Error('La lista de estudiantes actuales no tiene un formato válido');
      }
      
      if (!Array.isArray(missingStudents)) {
        console.error('Error: missingStudents no es un array válido', missingStudents);
        throw new Error('Los estudiantes ausentes no tienen un formato válido');
      }
      
      if (!Array.isArray(newStudents)) {
        console.error('Error: newStudents no es un array válido', newStudents);
        throw new Error('Los estudiantes nuevos no tienen un formato válido');
      }
      
      if (!Array.isArray(reactivatedStudents)) {
        console.warn('reactivatedStudents no es un array, se usará un array vacío');
        reactivatedStudents = [];
      }
      
      console.log('Estudiantes a actualizar:', changedStudents.length);
      console.log('Estudiantes ausentes en SIPI:', missingStudents.length);
      console.log('Estudiantes nuevos:', newStudents.length);
      console.log('Estudiantes reactivados:', reactivatedStudents.length);
      
      // Crear una copia profunda de los estudiantes actuales
      const updatedStudents = JSON.parse(JSON.stringify(currentStudents));
      
      // Estadísticas de actualización
      const stats = {
        total: changedStudents.length + missingStudents.length + newStudents.length + reactivatedStudents.length,
        updated: 0,
        new: 0,
        unchanged: 0,
        missing: missingStudents.length,
        markedInactive: 0,
        reactivated: reactivatedStudents.length
      };
      
      // Aplicar los cambios confirmados
      changedStudents.forEach(change => {
        try {
          // Verificar que el objeto change tenga la estructura esperada
          if (!change || !change.student || !change.student.Documento) {
            console.error('Objeto change inválido:', change);
            stats.unchanged++;
            return;
          }
          
          // Buscar el estudiante por documento (normalizado)
          const normalizedDoc = this.normalizeDocument(change.student.Documento);
          const index = updatedStudents.findIndex(s => 
            this.normalizeDocument(s.Documento) === normalizedDoc
          );
          
          if (index !== -1) {
            // Aplicar solo los campos que han cambiado
            const updatedStudent = { ...updatedStudents[index] };
            
            // Asegurarse de que el estudiante esté marcado como activo
            updatedStudent.Activo = true;
            
            // Verificar que change.changes sea un objeto válido
            if (!change.changes || typeof change.changes !== 'object') {
              console.error('Objeto change.changes inválido:', change.changes);
              stats.unchanged++;
              return;
            }
            
            Object.keys(change.changes).forEach(field => {
              if (!change.excluded || !change.excluded.includes(field)) {
                updatedStudent[field] = change.changes[field].newValue;
                console.log(`Campo actualizado: ${field}, Valor anterior: ${change.changes[field].oldValue}, Nuevo valor: ${change.changes[field].newValue}`);
              } else {
                console.log(`Campo excluido de la actualización: ${field}`);
              }
            });
            
            updatedStudents[index] = updatedStudent;
            stats.updated++;
            
            console.log(`Actualizado estudiante: ${updatedStudent['Nombre Completo'] || 'Sin nombre'} (${updatedStudent.Documento || 'Sin documento'})`);
          } else {
            console.warn(`No se encontró el estudiante con documento ${change.student.Documento} en la base de datos`);
            stats.unchanged++;
          }
        } catch (error) {
          console.error('Error al procesar estudiante para actualizar:', error, change);
          stats.unchanged++;
        }
      });
      
      // Procesar estudiantes ausentes en SIPI (moverlos a inactivos)
      const inactivePromises = [];
      
      console.log('Procesando estudiantes ausentes en SIPI:', missingStudents.length);
      
      for (const missingStudent of missingStudents) {
        try {
          // Verificar que el objeto missingStudent tenga la estructura esperada
          if (!missingStudent || !missingStudent.Documento) {
            console.error('Objeto missingStudent inválido:', missingStudent);
            continue;
          }
          
          const index = updatedStudents.findIndex(s => s.Documento === missingStudent.Documento);
          
          if (index !== -1) {
            console.log(`Procesando estudiante ausente: ${missingStudent['Nombre Completo'] || missingStudent.Documento}`);
            
            // Marcar como inactivo pero mantener en la base de datos
            updatedStudents[index] = {
              ...updatedStudents[index],
              Activo: false,
              FechaBaja: new Date().toLocaleDateString('es-ES')
            };
            stats.markedInactive++;
            
            console.log(`Marcado como inactivo: ${updatedStudents[index]['Nombre Completo'] || 'Sin nombre'} (${updatedStudents[index].Documento || 'Sin documento'})`);
            
            // Si Firebase está habilitado, mover el estudiante a la colección de inactivos
            if (this.USE_FIREBASE) {
              try {
                const studentId = updatedStudents[index].id || updatedStudents[index].Documento;
                if (studentId) {
                  console.log(`Moviendo estudiante ${studentId} a inactivos en Firebase...`);
                  
                  // Añadir metadatos de eliminación
                  const inactiveStudent = {
                    ...updatedStudents[index],
                    inactiveSince: new Date().toISOString(),
                    reason: 'missing_from_sipi'
                  };
                  
                  // Añadir la promesa a la lista para esperar a que todas se completen
                  const promise = FirebaseService.deleteStudent(studentId)
                    .then(() => {
                      console.log(`Estudiante ${studentId} movido a inactivos en Firebase`);
                      
                      // Añadir a la colección de inactivos
                      return FirebaseService.addInactiveStudent(inactiveStudent)
                        .then(() => console.log(`Estudiante ${studentId} añadido a inactivos en Firebase`))
                        .catch(error => {
                          console.error(`Error al añadir estudiante ${studentId} a inactivos en Firebase:`, error);
                          // Si hay error, guardar operación para sincronización posterior
                          SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, missingStudent);
                        });
                    })
                    .catch(error => {
                      console.error(`Error al eliminar estudiante ${studentId} de activos en Firebase:`, error);
                      // Si hay error, guardar operación para sincronización posterior
                      SyncService.addPendingOperation(SyncService.OPERATION_TYPES.DELETE, missingStudent);
                    });
                  
                  inactivePromises.push(promise);
                }
              } catch (error) {
                console.error('Error al mover estudiante a inactivos:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error al procesar estudiante ausente:', error, missingStudent);
        }
      }
      
      // Agregar estudiantes nuevos
      try {
        if (newStudents.length > 0) {
          console.log('Agregando estudiantes nuevos:', newStudents.length);
          updatedStudents.push(...newStudents);
          stats.new = newStudents.length;
        }
      } catch (error) {
        console.error('Error al agregar estudiantes nuevos:', error);
      }
      
      // Reactivar estudiantes
      try {
        if (reactivatedStudents.length > 0) {
          console.log('Reactivando estudiantes:', reactivatedStudents.length);
          
          reactivatedStudents.forEach(reactivatedStudent => {
            try {
              // Verificar que el objeto reactivatedStudent tenga la estructura esperada
              if (!reactivatedStudent || !reactivatedStudent.Documento) {
                console.error('Objeto reactivatedStudent inválido:', reactivatedStudent);
                return;
              }
              
              const index = updatedStudents.findIndex(s => s.Documento === reactivatedStudent.Documento);
              
              if (index !== -1) {
                console.log(`Reactivando estudiante: ${reactivatedStudent['Nombre Completo'] || reactivatedStudent.Documento}`);
                
                updatedStudents[index] = {
                  ...updatedStudents[index],
                  Activo: true,
                  FechaBaja: ''
                };
              } else {
                console.warn(`No se encontró el estudiante a reactivar con documento ${reactivatedStudent.Documento}`);
              }
            } catch (error) {
              console.error('Error al reactivar estudiante:', error, reactivatedStudent);
            }
          });
        }
      } catch (error) {
        console.error('Error al reactivar estudiantes:', error);
      }
      
      // Esperar a que todas las operaciones de Firebase se completen
      if (inactivePromises.length > 0) {
        console.log(`Esperando a que se completen ${inactivePromises.length} operaciones de Firebase...`);
        try {
          await Promise.all(inactivePromises);
          console.log(`${inactivePromises.length} estudiantes movidos a inactivos en Firebase`);
        } catch (error) {
          console.error('Error al mover estudiantes a inactivos en Firebase:', error);
        }
      }
      
      // Guardar los datos actualizados usando la función saveData
      console.log('Guardando datos actualizados, total de estudiantes:', updatedStudents.length);
      this.saveData(updatedStudents);
      
      console.log('Estadísticas de actualización:', stats);
      
      return {
        updatedStudents,
        stats
      };
    } catch (error) {
      console.error('Error en applySIPIChanges:', error);
      throw error; // Re-lanzar el error para que pueda ser capturado por el llamador
    }
  }
  
  // Función para detectar cambios entre la base de datos actual y los datos de SIPI
  static detectSIPIChanges(sipiData, currentStudents) {
    const changedStudents = [];
    const missingStudents = [];
    const newStudents = []; // Estudiantes nuevos que están en SIPI pero no en la base de datos
    const reactivatedStudents = []; // Estudiantes inactivos que aparecen en SIPI
    
    console.log('Detectando cambios entre SIPI y base de datos actual');
    console.log('Estudiantes en SIPI:', sipiData.length);
    console.log('Estudiantes en base de datos:', currentStudents.length);
    
    // Normalizar documentos en la base de datos actual para comparación
    const studentsByDocument = {};
    currentStudents.forEach(student => {
      if (student.Documento) {
        studentsByDocument[this.normalizeDocument(student.Documento)] = student;
      }
    });
    
    // Verificar estudiantes en SIPI y detectar cambios
    sipiData.forEach(sipiStudent => {
      if (!sipiStudent.Documento) return;
      
      const documento = this.normalizeDocument(sipiStudent.Documento);
      
      const existingStudent = studentsByDocument[documento];
      
      if (existingStudent) {
        // Verificar si el estudiante está inactivo y debe ser reactivado
        if (existingStudent.Activo === false) {
          console.log(`Estudiante inactivo encontrado en SIPI, reactivando: ${existingStudent['Nombre Completo']} (${existingStudent.Documento})`);
          
          // Marcar para reactivación y actualizar datos
          changedStudents.push({
            student: existingStudent,
            changes: {
              Activo: {
                oldValue: false,
                newValue: true
              },
              FechaBaja: {
                oldValue: existingStudent.FechaBaja || '',
                newValue: ''
              }
            },
            excluded: []
          });
          
          // Añadir a la lista de reactivados para estadísticas
          reactivatedStudents.push(existingStudent);
        } else {
          // Verificar si hay cambios en los campos
          const changes = {};
          let hasChanges = false;
          
          // Campos a comparar (solo los que vienen del archivo SIPI)
          const fieldsToCompare = [
            'Codigo',
            'Nombre Completo',
            'Sexo',
            'FechaNacimiento'
          ];
          
          fieldsToCompare.forEach(field => {
            // Solo comparar si el campo existe en ambos objetos
            if (sipiStudent[field] !== undefined && 
                existingStudent[field] !== undefined && 
                sipiStudent[field] !== existingStudent[field]) {
              
              // Valores no vacíos y diferentes
              if (sipiStudent[field] && existingStudent[field]) {
                changes[field] = {
                  oldValue: existingStudent[field],
                  newValue: sipiStudent[field]
                };
                hasChanges = true;
              } 
              // Valor vacío en la base de datos pero presente en SIPI
              else if (!existingStudent[field] && sipiStudent[field]) {
                changes[field] = {
                  oldValue: existingStudent[field] || '',
                  newValue: sipiStudent[field]
                };
                hasChanges = true;
              }
            }
          });
          
          if (hasChanges) {
            changedStudents.push({
              student: existingStudent,
              changes: changes,
              excluded: [] // Array para almacenar campos excluidos de la actualización
            });
          }
        }
        
        // Marcar este estudiante como encontrado
        delete studentsByDocument[documento];
      } else {
        // Este estudiante está en SIPI pero no en la base de datos
        newStudents.push({
          ...sipiStudent,
          Activo: true // Marcar como activo por defecto
        });
      }
    });
    
    // Los estudiantes que quedan en studentsByDocument son los que no están en SIPI
    Object.values(studentsByDocument).forEach(student => {
      missingStudents.push(student);
    });
    
    console.log('Estudiantes con cambios:', changedStudents.length);
    console.log('Estudiantes ausentes en SIPI:', missingStudents.length);
    console.log('Estudiantes nuevos en SIPI:', newStudents.length);
    console.log('Estudiantes reactivados:', reactivatedStudents.length);
    
    return {
      changedStudents,
      missingStudents,
      newStudents,
      reactivatedStudents,
      stats: {
        total: sipiData.length,
        changed: changedStudents.length,
        missing: missingStudents.length,
        new: newStudents.length,
        reactivated: reactivatedStudents.length
      }
    };
  }
  
  // Función para procesar los datos del archivo SIPI
  static processSIPIData(jsonData, currentStudents) {
    const processedData = [];
    
    console.log('Procesando archivo SIPI, filas totales:', jsonData.length);
    
    // Encontrar la estructura del archivo
    const headers = this.detectSIPIFileStructure(jsonData);
    
    if (!headers) {
      console.error('No se pudo detectar la estructura del archivo SIPI');
      return processedData;
    }
    
    console.log('Estructura detectada:', headers);
    
    const {
      dataStartRow,
      codigoIndex,
      nombreIndex,
      sexoIndex,
      edadIndex,
      documentoIndex,
      fechaNacimientoIndex
    } = headers;
    
    // Procesar las filas de datos
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Verificar si es una fila de datos válida (tiene código y nombre)
      if (row && row[codigoIndex] && row[nombreIndex]) {
        try {
          // Extraer solo los datos específicos que necesitamos
          const studentData = {
            Codigo: row[codigoIndex]?.toString() || '',
            'Nombre Completo': this.formatNombreCompleto(row[nombreIndex]?.toString() || ''),
            Sexo: sexoIndex !== -1 ? (row[sexoIndex]?.toString() || '') : '',
            Edad: edadIndex !== -1 ? (row[edadIndex]?.toString() || '') : '',
            Documento: documentoIndex !== -1 ? (row[documentoIndex]?.toString() || '') : '',
            FechaNacimiento: fechaNacimientoIndex !== -1 && row[fechaNacimientoIndex] 
              ? this.excelDateToString(row[fechaNacimientoIndex]) 
              : ''
          };
          
          console.log('Procesando estudiante:', studentData['Nombre Completo']);
          
          // Validar el documento
          if (!studentData.Documento) {
            console.log('Estudiante sin documento, intentando extraer de otros campos:', studentData['Nombre Completo']);
            // Intentar extraer el documento del nombre o de otros campos
            studentData.Documento = this.extractDocumentFromData(studentData, row);
          }
          
          // Normalizar el documento (eliminar espacios, guiones, etc.)
          if (studentData.Documento) {
            studentData.Documento = this.normalizeDocument(studentData.Documento);
            console.log('Documento normalizado:', studentData.Documento);
          }
          
          // Solo procesar estudiantes con documento válido
          if (studentData.Documento && studentData.Documento.length > 5) {
            processedData.push(studentData);
          } else {
            console.warn('Estudiante sin documento válido:', studentData['Nombre Completo']);
          }
        } catch (error) {
          console.error('Error al procesar fila del archivo SIPI:', error, row);
          // Continuar con la siguiente fila
        }
      }
    }
    
    console.log('Total de estudiantes procesados:', processedData.length);
    return processedData;
  }
  
  // Función para formatear el nombre completo (capitalizado y reordenado)
  static formatNombreCompleto(nombreCompleto) {
    if (!nombreCompleto) return '';
    
    // Dividir por coma si existe
    const partes = nombreCompleto.split(',');
    
    if (partes.length === 2) {
      // Formato "Apellido, Nombre" -> "Nombre Apellido"
      const apellido = this.capitalizeWords(partes[0].trim());
      const nombre = this.capitalizeWords(partes[1].trim());
      return `${nombre} ${apellido}`;
    } else {
      // Si no hay coma, simplemente capitalizar
      return this.capitalizeWords(nombreCompleto.trim());
    }
  }
  
  // Función para capitalizar palabras
  static capitalizeWords(text) {
    if (!text) return '';
    
    return text.split(' ')
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  // Función para detectar la estructura del archivo SIPI
  static detectSIPIFileStructure(jsonData) {
    // Buscar encabezados conocidos
    const headerPatterns = [
      { field: 'codigo', patterns: ['Código', 'Codigo', 'Cod.', 'N°', 'Numero', 'Nro', 'Nro.', 'N', 'Nº'] },
      { field: 'nombre', patterns: ['Apellidos, Nombres', 'Nombre Completo', 'Alumno', 'Estudiante', 'Apellido y Nombre', 'Nombre', 'Apellido, Nombre', 'Apellidos y Nombres'] },
      { field: 'sexo', patterns: ['Sexo', 'Género', 'Genero', 'Sex'] },
      { field: 'edad', patterns: ['Edad', 'Años', 'Age', 'Año'] },
      { field: 'documento', patterns: ['Documento', 'DNI', 'Doc.', 'Identificación', 'Identificacion', 'ID', 'Cédula', 'Cedula', 'CI'] },
      { field: 'fechaNacimiento', patterns: ['Fecha Nacimiento', 'Nacimiento', 'Fecha de Nacimiento', 'F. Nac.', 'Nac.', 'Nac', 'Birth', 'Fecha Nac'] }
    ];
    
    // Imprimir las primeras filas para depuración
    console.log('Primeras 5 filas del archivo:');
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      console.log(`Fila ${i}:`, jsonData[i]);
    }
    
    // Buscar la fila de encabezados
    let headerRow = -1;
    let maxHeaderMatches = 0;
    
    // Buscar en las primeras 10 filas
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row) continue;
      
      let matches = 0;
      
      // Contar cuántos patrones de encabezado coinciden en esta fila
      for (const { patterns } of headerPatterns) {
        for (const pattern of patterns) {
          for (const cell of row) {
            if (cell && typeof cell === 'string' && 
                cell.toLowerCase().includes(pattern.toLowerCase())) {
              matches++;
              break;
            }
          }
        }
      }
      
      console.log(`Fila ${i}, coincidencias de encabezados: ${matches}`);
      
      if (matches > maxHeaderMatches) {
        maxHeaderMatches = matches;
        headerRow = i;
      }
    }
    
    // Si no encontramos una fila de encabezados con al menos 2 coincidencias, fallar
    if (headerRow === -1 || maxHeaderMatches < 2) {
      console.error('No se pudo encontrar una fila de encabezados válida');
      return null;
    }
    
    console.log(`Fila de encabezados encontrada: ${headerRow}, con ${maxHeaderMatches} coincidencias`);
    console.log('Encabezados:', jsonData[headerRow]);
    
    // Encontrar los índices de las columnas relevantes
    const dataStartRow = headerRow + 1;
    
    // Buscar los índices de las columnas
    const codigoIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[0].patterns);
    const nombreIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[1].patterns);
    const sexoIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[2].patterns);
    const edadIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[3].patterns);
    const documentoIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[4].patterns);
    const fechaNacimientoIndex = this.findColumnIndex(jsonData[headerRow], headerPatterns[5].patterns);
    
    console.log('Índices de columnas encontrados:');
    console.log('Código:', codigoIndex);
    console.log('Nombre:', nombreIndex);
    console.log('Sexo:', sexoIndex);
    console.log('Edad:', edadIndex);
    console.log('Documento:', documentoIndex);
    console.log('Fecha Nacimiento:', fechaNacimientoIndex);
    
    // Verificar que al menos tenemos código y nombre
    if (codigoIndex === -1 || nombreIndex === -1) {
      console.error('No se pudieron encontrar las columnas obligatorias (código y nombre)');
      return null;
    }
    
    return {
      dataStartRow,
      codigoIndex,
      nombreIndex,
      sexoIndex,
      edadIndex,
      documentoIndex,
      fechaNacimientoIndex
    };
  }
  
  // Función auxiliar para verificar si una fila contiene alguno de los patrones
  static rowContainsAnyPattern(row, patterns) {
    return row.some(cell => 
      cell && typeof cell === 'string' && 
      patterns.some(pattern => 
        cell.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }
  
  // Función auxiliar para encontrar el índice de una columna basado en patrones
  static findColumnIndex(row, patterns) {
    if (!row) return -1;
    
    // Primero buscar coincidencias exactas (ignorando mayúsculas/minúsculas)
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (!cell) continue;
      
      const cellStr = cell.toString().toLowerCase().trim();
      
      for (const pattern of patterns) {
        const patternLower = pattern.toLowerCase().trim();
        if (cellStr === patternLower) {
          console.log(`Coincidencia exacta encontrada para '${pattern}' en columna ${i}: '${cell}'`);
          return i;
        }
      }
    }
    
    // Si no hay coincidencias exactas, buscar coincidencias parciales
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (!cell) continue;
      
      const cellStr = cell.toString().toLowerCase().trim();
      
      for (const pattern of patterns) {
        const patternLower = pattern.toLowerCase().trim();
        if (cellStr.includes(patternLower) || patternLower.includes(cellStr)) {
          console.log(`Coincidencia parcial encontrada para '${pattern}' en columna ${i}: '${cell}'`);
          return i;
        }
      }
    }
    
    // Si aún no hay coincidencias, buscar por palabras clave
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (!cell) continue;
      
      const cellStr = cell.toString().toLowerCase().trim();
      const cellWords = cellStr.split(/\s+/);
      
      for (const pattern of patterns) {
        const patternLower = pattern.toLowerCase().trim();
        const patternWords = patternLower.split(/\s+/);
        
        // Verificar si alguna palabra clave coincide
        for (const patternWord of patternWords) {
          if (patternWord.length > 2 && cellWords.some(word => word.includes(patternWord))) {
            console.log(`Coincidencia por palabra clave '${patternWord}' encontrada para '${pattern}' en columna ${i}: '${cell}'`);
            return i;
          }
        }
      }
    }
    
    console.log(`No se encontró coincidencia para patrones: ${patterns.join(', ')}`);
    return -1;
  }
  
  // Función para extraer el documento de los datos
  static extractDocumentFromData(studentData, row) {
    // Si ya tenemos un documento, devolverlo
    if (studentData.Documento) {
      return studentData.Documento;
    }
    
    // Intentar extraer el documento del nombre completo
    if (studentData['Nombre Completo']) {
      const nombreCompleto = studentData['Nombre Completo'].toString();
      
      // Buscar patrones de DNI en el nombre (por ejemplo, "Juan Pérez 12345678")
      const dniMatch = nombreCompleto.match(/\b(\d{7,9})\b/);
      if (dniMatch) {
        return dniMatch[1];
      }
    }
    
    // Buscar en todas las columnas por un número que parezca un DNI
    if (row) {
      for (let i = 0; i < row.length; i++) {
        if (row[i] && typeof row[i] === 'string') {
          const value = row[i].toString();
          const dniMatch = value.match(/\b(\d{7,9})\b/);
          if (dniMatch) {
            return dniMatch[1];
          }
        }
      }
    }
    
    return '';
  }
  
  // Función para normalizar el documento
  static normalizeDocument(documento) {
    if (!documento) return '';
    
    // Convertir a string si no lo es
    documento = documento.toString();
    
    // Eliminar espacios, guiones, puntos y otros caracteres no numéricos
    return documento.replace(/[\s\-\.]/g, '');
  }
  
  // Función para actualizar los estudiantes existentes con datos de SIPI
  static updateStudentsFromSIPI(currentStudents, sipiData) {
    // Crear una copia de los estudiantes actuales
    const updatedStudents = [...currentStudents];
    
    // Mapear estudiantes por documento para búsqueda rápida
    const studentsByDocument = {};
    currentStudents.forEach(student => {
      if (student.Documento) {
        studentsByDocument[this.normalizeDocument(student.Documento)] = student;
      }
    });
    
    // Estadísticas de actualización
    const stats = {
      total: sipiData.length,
      updated: 0,
      new: 0,
      unchanged: 0,
      errors: 0
    };
    
    // Procesar cada estudiante del archivo SIPI
    for (const sipiStudent of sipiData) {
      try {
        // Normalizar el documento para asegurar consistencia
        const documento = this.normalizeDocument(sipiStudent.Documento);
        
        if (!documento) {
          console.warn('Estudiante SIPI sin documento válido:', sipiStudent['Nombre Completo']);
          stats.errors++;
          continue;
        }
        
        // Buscar el estudiante en la base de datos actual
        const existingStudent = studentsByDocument[documento];
        
        if (existingStudent) {
          // Actualizar estudiante existente
          const updatedStudent = this.mergeStudentData(existingStudent, sipiStudent);
          
          // Actualizar en el array de estudiantes
          const index = updatedStudents.findIndex(s => s.Documento === documento);
          if (index !== -1) {
            // Verificar si realmente hubo cambios
            if (JSON.stringify(updatedStudents[index]) !== JSON.stringify(updatedStudent)) {
              updatedStudents[index] = updatedStudent;
              stats.updated++;
            } else {
              stats.unchanged++;
            }
          }
        } else {
          // Crear nuevo estudiante
          const newStudent = {
            ...sipiStudent,
            // Añadir campos que podrían no estar en el archivo SIPI pero son necesarios
            'Aptitud Física': '',
            'Fecha Aptitud Física': '',
            'Certificado Médico': '',
            'Fecha Certificado Médico': '',
            'Ficha de Inscripción': '',
            'Fecha Ficha de Inscripción': '',
            'Foto': '',
            'Fecha Foto': '',
            'Documento Tutor': '',
            'Fecha Documento Tutor': '',
            'Observaciones': ''
          };
          
          // Añadir al array de estudiantes
          updatedStudents.push(newStudent);
          stats.new++;
        }
      } catch (error) {
        console.error('Error al procesar estudiante SIPI:', error, sipiStudent);
        stats.errors++;
      }
    }
    
    console.log('Estadísticas de actualización:', stats);
    
    return {
      updatedStudents,
      stats
    };
  }
  
  // Función para combinar datos de estudiante existente con datos de SIPI
  static mergeStudentData(existingStudent, sipiStudent) {
    // Crear una copia del estudiante existente
    const mergedStudent = { ...existingStudent };
    
    // Lista de campos que siempre se actualizan desde SIPI
    const alwaysUpdateFields = [
      'Codigo',
      'Estado',
      'FechaInicio',
      'FechaFin',
      'Actividades'
    ];
    
    // Actualizar campos que siempre se actualizan
    alwaysUpdateFields.forEach(field => {
      if (sipiStudent[field]) {
        mergedStudent[field] = sipiStudent[field];
      }
    });
    
    // Actualizar campos solo si están vacíos en el estudiante existente
    const updateIfEmptyFields = [
      'Nombre Completo',
      'Sexo',
      'Edad',
      'Turno',
      'Dia de Piscina'
    ];
    
    updateIfEmptyFields.forEach(field => {
      if (sipiStudent[field] && (!mergedStudent[field] || mergedStudent[field] === '')) {
        mergedStudent[field] = sipiStudent[field];
      }
    });
    
    // Actualizar campos adicionales si existen en SIPI
    if (sipiStudent.Grupo && (!mergedStudent.Grupo || mergedStudent.Grupo === '')) {
      mergedStudent.Grupo = sipiStudent.Grupo;
    }
    
    if (sipiStudent.Profesor && (!mergedStudent.Profesor || mergedStudent.Profesor === '')) {
      mergedStudent.Profesor = sipiStudent.Profesor;
    }
    
    // Si SIPI tiene nombre y apellido separados pero el estudiante existente no
    if (sipiStudent.Nombre && sipiStudent.Apellido) {
      if (!mergedStudent.Nombre) mergedStudent.Nombre = sipiStudent.Nombre;
      if (!mergedStudent.Apellido) mergedStudent.Apellido = sipiStudent.Apellido;
    }
    
    return mergedStudent;
  }

  // Función auxiliar para convertir fechas de Excel a formato DD/MM/YYYY
  static excelDateToString(excelDate) {
    // Excel usa un sistema donde 1 es el 1 de enero de 1900
    // JavaScript usa milisegundos desde el 1 de enero de 1970
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Función para generar una vista previa del archivo SIPI
  static async generateSIPIFilePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          
          // Verificar si es un archivo Excel
          if (!data.startsWith('data:application/vnd.ms-excel') && 
              !data.startsWith('data:application/vnd.openxmlformats-officedocument')) {
            throw new Error('El archivo no es un archivo Excel válido');
          }
          
          // Convertir a array de bytes
          const binary = atob(data.split(',')[1]);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const bytes = new Uint8Array(array);
          
          // Leer el archivo Excel
          const workbook = XLSX.read(bytes, { type: 'array' });
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON usando el rango específico B12:Y100
          // Nota: en XLSX, las celdas se indexan desde 0, pero el formato de rango usa letras para columnas
          // y números para filas, por lo que B12:Y100 significa columnas B-Y (1-24) y filas 12-100
          const range = {s: {c: 1, r: 11}, e: {c: 24, r: 99}}; // B12:Y100 (0-indexed)
          
          // Usar la fila 12 (índice 11) como encabezados
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            range: range
          });
          
          // Devolver las primeras filas para la vista previa
          resolve({
            data: jsonData.slice(0, 20), // Mostrar hasta 20 filas
            totalRows: jsonData.length,
            range: 'B12:Y100'
          });
        } catch (error) {
          console.error('Error al generar vista previa:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Función para obtener sujetos inactivos
  static getInactiveStudents() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.USE_FIREBASE) {
          const inactiveStudents = await FirebaseService.getAllInactiveStudents();
          resolve(inactiveStudents);
        } else {
          // Si no se usa Firebase, obtener los sujetos inactivos del localStorage
          const students = await this.loadCSVData(true);
          const inactiveStudents = students.filter(student => student.Activo === false);
          resolve(inactiveStudents);
        }
      } catch (error) {
        console.error('Error al obtener sujetos inactivos:', error);
        reject(error);
      }
    });
  }

  // Función para restaurar un sujeto inactivo
  static restoreInactiveStudent(studentId, mergeStrategy = null, customData = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Validar el ID del sujeto
        if (!studentId) {
          console.error('ID de sujeto no válido para restaurar');
          reject(new Error('ID de sujeto no válido'));
          return;
        }

        console.log(`Intentando restaurar sujeto con ID: ${studentId}, estrategia: ${mergeStrategy || 'ninguna'}`);
        
        if (this.USE_FIREBASE) {
          const result = await FirebaseService.restoreInactiveStudent(studentId, mergeStrategy, customData);
          console.log('Resultado de Firebase:', result);
          
          // Si hay un duplicado y no tenemos estrategia de fusión, devolver la información
          if (result && !result.success && result.duplicate) {
            // Verificar que los datos de sujetos estén completos
            if (!result.inactiveStudent || !result.existingStudent) {
              console.error('Datos de sujetos incompletos en la respuesta de duplicado de Firebase');
              reject(new Error('Datos de sujetos incompletos'));
              return;
            }
            
            resolve({
              success: false,
              duplicate: true,
              inactiveStudent: result.inactiveStudent,
              existingStudent: result.existingStudent
            });
            return;
          }
          
          // Si se fusionó correctamente o no había duplicado
          if (result && result.success) {
            resolve({
              success: true,
              merged: result.merged || false,
              student: result.student
            });
            return;
          }
          
          // Si llegamos aquí, hubo un error
          console.error('Error al restaurar sujeto en Firebase:', result?.error || 'Error desconocido');
          reject(new Error(result?.error || 'Error al restaurar sujeto'));
          return;
        } else {
          // Si no se usa Firebase, restaurar el sujeto en localStorage
          const students = await this.loadCSVData(true);
          
          // Buscar el sujeto inactivo
          const inactiveStudent = students.find(s => 
            (s.id === studentId || s.Documento === studentId) && !s.Activo
          );
          
          if (!inactiveStudent) {
            console.error('Sujeto inactivo no encontrado:', studentId);
            reject(new Error('Sujeto inactivo no encontrado'));
            return;
          }
          
          // Buscar si hay un sujeto activo con el mismo nombre
          const existingStudent = students.find(s => 
            s.Activo && 
            s['Nombre Completo'] === inactiveStudent['Nombre Completo'] && 
            (s.id !== studentId && s.Documento !== studentId)
          );
          
          // Si hay un duplicado y no tenemos estrategia de fusión, devolver la información
          if (existingStudent && !mergeStrategy) {
            console.log('Duplicado encontrado en localStorage:', {
              inactiveStudent,
              existingStudent
            });
            
            resolve({
              success: false,
              duplicate: true,
              inactiveStudent: { ...inactiveStudent, Activo: true },
              existingStudent
            });
            return;
          }
          
          // Si hay un duplicado y tenemos estrategia de fusión, aplicarla
          if (existingStudent && mergeStrategy) {
            console.log(`Aplicando estrategia de fusión: ${mergeStrategy}`);
            let mergedStudent = { ...existingStudent };
            
            // Aplicar la estrategia de fusión
            if (mergeStrategy === 'keepInactive') {
              // Mantener datos del sujeto inactivo
              mergedStudent = {
                ...mergedStudent,
                ...inactiveStudent,
                id: existingStudent.id,
                Activo: true,
                FechaBaja: ''
              };
            } else if (mergeStrategy === 'keepActive') {
              // Mantener datos del sujeto activo (no hacer nada)
            } else if (mergeStrategy === 'merge') {
              // Fusionar datos (campos no vacíos del inactivo tienen prioridad)
              Object.keys(inactiveStudent).forEach(key => {
                if (inactiveStudent[key] && 
                    inactiveStudent[key] !== '' && 
                    key !== 'id' && 
                    key !== 'FechaBaja') {
                  mergedStudent[key] = inactiveStudent[key];
                }
              });
            }
            
            // Actualizar el sujeto fusionado
            const updatedStudents = students.map(s => {
              if (s.id === existingStudent.id || s.Documento === existingStudent.Documento) {
                return mergedStudent;
              }
              // Eliminar el sujeto inactivo
              if (s.id === inactiveStudent.id || s.Documento === inactiveStudent.Documento) {
                return null;
              }
              return s;
            }).filter(Boolean); // Eliminar elementos null
            
            this.saveData(updatedStudents);
            
            console.log('Fusión completada con éxito:', mergedStudent);
            
            resolve({
              success: true,
              merged: true,
              student: mergedStudent
            });
            return;
          }
          
          // Si no hay duplicado, simplemente restaurar
          console.log('No hay duplicado, restaurando sujeto inactivo');
          const updatedStudents = students.map(student => {
            if (student.id === studentId || student.Documento === studentId) {
              return {
                ...student,
                Activo: true,
                FechaBaja: ''
              };
            }
            return student;
          });
          
          this.saveData(updatedStudents);
          
          const restoredStudent = {
            ...inactiveStudent,
            Activo: true,
            FechaBaja: ''
          };
          
          console.log('Sujeto restaurado con éxito:', restoredStudent);
          
          resolve({
            success: true,
            student: restoredStudent
          });
        }
      } catch (error) {
        console.error('Error al restaurar sujeto inactivo:', error);
        reject(error);
      }
    });
  }

  // Función para eliminar definitivamente estudiantes inactivos en lote
  static deleteInactiveStudentsBatch(studentsToDelete) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('DataService.deleteInactiveStudentsBatch - Estudiantes a eliminar:', studentsToDelete.length);
        
        if (!studentsToDelete || studentsToDelete.length === 0) {
          console.error('Error: No hay estudiantes para eliminar en lote');
          resolve({ success: false, error: 'No se proporcionaron estudiantes para eliminar' });
          return;
        }
        
        let deletedCount = 0;
        
        // Si Firebase está habilitado, eliminar de Firebase primero
        if (this.USE_FIREBASE) {
          try {
            console.log('Eliminando estudiantes inactivos de Firebase...');
            
            // Eliminar cada estudiante de Firebase
            for (const student of studentsToDelete) {
              try {
                // Verificar que el estudiante tenga un ID válido
                if (!student.id) {
                  console.warn('Advertencia: Estudiante sin ID en Firebase, intentando buscar por documento:', student);
                  
                  if (!student.Documento) {
                    console.error('Error: Estudiante sin ID ni documento, no se puede eliminar de Firebase:', student);
                    continue;
                  }
                  
                  // Intentar buscar el estudiante por documento
                  const inactiveStudent = await FirebaseService.getInactiveStudentByDocumento(student.Documento);
                  if (inactiveStudent) {
                    // Si lo encontramos, eliminar usando su ID
                    await FirebaseService.deleteInactiveStudentPermanently(inactiveStudent.id);
                    deletedCount++;
                    console.log(`Estudiante inactivo con documento ${student.Documento} eliminado de Firebase`);
                  } else {
                    console.warn(`No se encontró el estudiante inactivo con documento ${student.Documento} en Firebase`);
                  }
                } else {
                  // Si tiene ID, eliminar directamente
                  await FirebaseService.deleteInactiveStudentPermanently(student.id);
                  deletedCount++;
                  console.log(`Estudiante inactivo con ID ${student.id} eliminado de Firebase`);
                }
              } catch (error) {
                console.error(`Error al eliminar estudiante inactivo de Firebase:`, error, student);
                // Continuamos con el siguiente estudiante
              }
            }
          } catch (error) {
            console.error('Error al eliminar estudiantes inactivos de Firebase:', error);
            // Continuamos con localStorage si hay error en Firebase
          }
        }
        
        // Eliminar de localStorage
        try {
          console.log('Eliminando estudiantes inactivos de localStorage...');
          
          // Obtener todos los estudiantes de localStorage
          const allStudentsData = localStorage.getItem(this.STORAGE_KEY);
          if (allStudentsData) {
            const allStudents = JSON.parse(allStudentsData);
            
            // Crear arrays de IDs y documentos para comparar
            const idsToDelete = studentsToDelete.map(student => student.id).filter(id => id);
            const docsToDelete = studentsToDelete.map(student => student.Documento).filter(doc => doc);
            
            console.log('IDs a eliminar:', idsToDelete);
            console.log('Documentos a eliminar:', docsToDelete);
            
            let deletedFromLocalStorage = 0;
            
            // Filtrar para mantener solo los estudiantes que no están en la lista de eliminación
            const updatedStudents = allStudents.filter(student => {
              // Si el estudiante está inactivo y su ID o documento está en la lista de eliminación, lo eliminamos
              if (student.Activo === false && 
                  (idsToDelete.includes(student.id) || docsToDelete.includes(student.Documento))) {
                console.log(`Eliminando estudiante inactivo con documento ${student.Documento} de localStorage`);
                deletedFromLocalStorage++;
                
                if (!this.USE_FIREBASE) {
                  // Solo incrementamos el contador si no estamos usando Firebase,
                  // ya que si usamos Firebase, ya contamos las eliminaciones arriba
                  deletedCount++;
                }
                return false;
              }
              return true;
            });
            
            console.log(`Se eliminaron ${deletedFromLocalStorage} estudiantes inactivos de localStorage`);
            
            // Guardar la lista actualizada en localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedStudents));
            console.log(`Estudiantes restantes en localStorage: ${updatedStudents.length}`);
          } else {
            console.warn('No se encontraron datos en localStorage');
          }
        } catch (error) {
          console.error('Error al eliminar estudiantes inactivos de localStorage:', error);
          // Si hay error al eliminar de localStorage, pero ya eliminamos algunos de Firebase,
          // consideramos que la operación tuvo éxito parcial
          if (deletedCount > 0) {
            resolve({ 
              success: true, 
              count: deletedCount,
              partial: true,
              error: `Se eliminaron ${deletedCount} estudiantes, pero hubo un error con localStorage: ${error.message}`
            });
            return;
          }
          
          // Si no eliminamos ninguno, consideramos que la operación falló
          resolve({ success: false, error: `Error al eliminar estudiantes: ${error.message}` });
          return;
        }
        
        // Si llegamos aquí, la operación tuvo éxito
        console.log(`Eliminación completada. Total eliminados: ${deletedCount}`);
        resolve({ success: true, count: deletedCount });
      } catch (error) {
        console.error('Error general al eliminar estudiantes inactivos en lote:', error);
        reject(error);
      }
    });
  }
}

// Exportar la clase DataService
export default DataService;

// Exponer DataService globalmente para que pueda ser accedido desde el módulo de configuración de Firebase
if (typeof window !== 'undefined') {
  window.DataService = DataService;
}
