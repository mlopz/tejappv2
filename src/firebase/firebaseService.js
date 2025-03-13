import { db } from './config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  setDoc,
  writeBatch,
  getDoc,
  arrayRemove,
  orderBy,
  arrayUnion,
  FieldValue
} from 'firebase/firestore';
import { generateHexId } from '../utils/idGenerator';

// Nombre de la colección de sujetos en Firestore
const STUDENTS_COLLECTION = 'students';
// Nombre de la colección de sujetos inactivos en Firestore
const INACTIVE_STUDENTS_COLLECTION = 'inactive_students';

// Colecciones para intervenciones y familias
const FAMILIAS_COLLECTION = 'familias';
const INTERVENCIONES_INDIVIDUALES_COLLECTION = 'intervencionesIndividuales';
const INTERVENCIONES_FAMILIARES_COLLECTION = 'intervencionesFamiliares';

class FirebaseService {
  // Verificar si Firebase está inicializado
  static isInitialized() {
    return !!db();
  }

  // Obtener todos los sujetos
  static async getAllStudents() {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return [];
      }

      const studentsCollection = collection(firestore, STUDENTS_COLLECTION);
      const querySnapshot = await getDocs(studentsCollection);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Se cargaron ${students.length} estudiantes desde Firebase`);
      return students;
    } catch (error) {
      console.error('Error al obtener sujetos:', error);
      throw error;
    }
  }

  // Agregar un nuevo sujeto
  static async addStudent(student) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      // Generar un ID hexadecimal único para el estudiante
      const hexId = generateHexId();
      
      // Agregar el ID hexadecimal al objeto del estudiante
      const studentWithId = {
        ...student,
        hexId: hexId
      };
      
      // Usar addDoc para que Firestore genere un ID automático
      const docRef = await addDoc(collection(firestore, STUDENTS_COLLECTION), studentWithId);
      
      // Devolver el estudiante con su ID
      return { id: docRef.id, ...studentWithId };
    } catch (error) {
      console.error('Error al agregar sujeto:', error);
      throw error;
    }
  }

  // Actualizar un sujeto existente
  static async updateStudent(id, student) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      console.log(`Actualizando estudiante con ID: ${id}`, student);

      // Asegurarse de que el estudiante tenga un hexId
      if (!student.hexId) {
        student.hexId = generateHexId();
      }

      // Obtener la referencia al documento
      const studentRef = doc(firestore, STUDENTS_COLLECTION, id);
      
      // Verificar que el documento existe antes de actualizarlo
      const docSnap = await getDoc(studentRef);
      if (!docSnap.exists()) {
        console.error(`Error: No se encontró el estudiante con ID ${id} para actualizar`);
        return null;
      }
      
      // Actualizar solo los campos proporcionados, no reemplazar todo el documento
      await updateDoc(studentRef, student);
      
      console.log(`Estudiante con ID ${id} actualizado correctamente`);
      return { id, ...student };
    } catch (error) {
      console.error('Error al actualizar sujeto:', error);
      throw error;
    }
  }

  // Eliminar un sujeto
  static async deleteStudent(id) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      console.log(`Intentando eliminar estudiante con ID: ${id}`);

      // Primero obtenemos el sujeto para moverlo a inactivos
      const studentRef = doc(firestore, STUDENTS_COLLECTION, id);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        
        console.log(`Estudiante encontrado:`, studentData);
        
        // Asegurarse de que el estudiante tenga un hexId
        if (!studentData.hexId) {
          studentData.hexId = generateHexId();
        }
        
        // Añadir metadatos de eliminación
        const inactiveStudent = {
          ...studentData,
          id: id, // Preservar el ID original
          inactiveSince: new Date().toISOString(),
          reason: 'deleted_by_user'
        };
        
        console.log(`Moviendo estudiante a inactivos:`, inactiveStudent);
        
        // Guardar en la colección de inactivos usando addDoc para generar un nuevo ID
        await addDoc(collection(firestore, INACTIVE_STUDENTS_COLLECTION), inactiveStudent);
        
        // Eliminar de la colección principal
        await deleteDoc(studentRef);
        console.log(`Estudiante eliminado correctamente de la colección principal`);
      } else {
        console.warn(`No se encontró el estudiante con ID: ${id}`);
      }
      
      return id;
    } catch (error) {
      console.error('Error al eliminar sujeto:', error);
      throw error;
    }
  }

  // Buscar sujetos por documento de identidad
  static async getStudentByDocumento(documento) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      const q = query(
        collection(firestore, STUDENTS_COLLECTION),
        where('Documento', '==', documento)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error al buscar sujeto por documento:', error);
      throw error;
    }
  }

  // Importar múltiples sujetos (para migración inicial o carga masiva)
  static async importStudents(students) {
    try {
      const firestore = db();
      
      // Validar que students sea un array
      if (!Array.isArray(students)) {
        console.error('Error: students debe ser un array', typeof students);
        return { success: false, count: 0, error: 'students_not_array' };
      }

      // Validar que el array no esté vacío
      if (students.length === 0) {
        console.warn('Advertencia: array de estudiantes vacío');
        return { success: true, count: 0 };
      }

      console.log(`Procesando ${students.length} estudiantes para importación`);
      
      // Primero, obtener todos los estudiantes existentes para verificar duplicados
      // Usamos un mapa para acceder rápidamente por documento
      const existingStudentsSnapshot = await getDocs(collection(firestore, STUDENTS_COLLECTION));
      const existingStudentsByDoc = {};
      const existingStudentsByHexId = {};
      
      existingStudentsSnapshot.forEach(doc => {
        const data = doc.data();
        // Mapear por documento
        if (data.Documento) {
          existingStudentsByDoc[data.Documento] = {
            id: doc.id,
            ...data
          };
        }
        // Mapear también por hexId si existe
        if (data.hexId) {
          existingStudentsByHexId[data.hexId] = {
            id: doc.id,
            ...data
          };
        }
      });
      
      console.log(`Se encontraron ${Object.keys(existingStudentsByDoc).length} estudiantes existentes en la base de datos`);
      
      // Estadísticas
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      
      // Procesar cada estudiante de forma individual
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        // Validar que el estudiante tenga un documento
        if (!student || !student.Documento) {
          console.warn(`Estudiante sin Documento en posición ${i}, se omitirá:`, student);
          errorCount++;
          continue;
        }

        try {
          // Limpiar el objeto estudiante para asegurar que sea compatible con Firestore
          const cleanStudent = this.sanitizeStudentData(student);
          
          // Asegurarse de que el estudiante tenga un hexId
          if (!cleanStudent.hexId) {
            cleanStudent.hexId = generateHexId();
          }
          
          // Verificar si el estudiante ya existe (primero por hexId, luego por documento)
          let existingStudent = null;
          let existingId = null;
          
          if (cleanStudent.hexId && existingStudentsByHexId[cleanStudent.hexId]) {
            // Si existe por hexId, usamos ese
            existingStudent = existingStudentsByHexId[cleanStudent.hexId];
            existingId = existingStudent.id;
            console.log(`Encontrado estudiante existente por hexId: ${cleanStudent.hexId}, ID: ${existingId}`);
          } else if (existingStudentsByDoc[cleanStudent.Documento]) {
            // Si existe por documento, usamos ese
            existingStudent = existingStudentsByDoc[cleanStudent.Documento];
            existingId = existingStudent.id;
            console.log(`Encontrado estudiante existente por documento: ${cleanStudent.Documento}, ID: ${existingId}`);
          }
          
          if (existingId) {
            // Actualizar estudiante existente usando su ID de documento
            const docRef = doc(firestore, STUDENTS_COLLECTION, existingId);
            await updateDoc(docRef, cleanStudent);
            
            // Actualizar nuestros mapas locales para mantener consistencia
            existingStudentsByDoc[cleanStudent.Documento] = {
              id: existingId,
              ...cleanStudent
            };
            existingStudentsByHexId[cleanStudent.hexId] = {
              id: existingId,
              ...cleanStudent
            };
            
            updatedCount++;
            console.log(`Actualizado estudiante con ID: ${existingId}, Documento: ${cleanStudent.Documento}`);
          } else {
            // Crear nuevo estudiante con ID generado automáticamente
            const docRef = await addDoc(collection(firestore, STUDENTS_COLLECTION), cleanStudent);
            const newId = docRef.id;
            
            // Actualizar nuestros mapas locales para mantener consistencia
            existingStudentsByDoc[cleanStudent.Documento] = {
              id: newId,
              ...cleanStudent
            };
            existingStudentsByHexId[cleanStudent.hexId] = {
              id: newId,
              ...cleanStudent
            };
            
            createdCount++;
            console.log(`Creado nuevo estudiante con ID: ${newId}, Documento: ${cleanStudent.Documento}`);
          }
        } catch (error) {
          console.error(`Error al procesar estudiante ${student.Documento}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Importación completada: ${createdCount} creados, ${updatedCount} actualizados, ${errorCount} errores`);
      
      return {
        success: true,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        total: students.length
      };
      
    } catch (error) {
      console.error('Error en importStudents:', error);
      return { success: false, error: error.message };
    }
  }

  // Sanitiza los datos de un estudiante para asegurar compatibilidad con Firestore
  static sanitizeStudentData(student) {
    // Crear una copia para no modificar el original
    const cleanStudent = { ...student };
    
    // Asegurar que todos los campos existan
    cleanStudent.Nombre = cleanStudent.Nombre || '';
    cleanStudent.Apellido = cleanStudent.Apellido || '';
    cleanStudent['Nombre Completo'] = cleanStudent['Nombre Completo'] || 
                                    `${cleanStudent.Nombre} ${cleanStudent.Apellido}`.trim();
    cleanStudent.Activo = cleanStudent.Activo !== false;
    
    // Eliminar campos inválidos para Firestore
    Object.keys(cleanStudent).forEach(key => {
      const value = cleanStudent[key];
      
      // Eliminar valores undefined o funciones
      if (value === undefined || typeof value === 'function') {
        delete cleanStudent[key];
      }
      
      // Convertir fechas a strings si son objetos Date
      if (value instanceof Date) {
        cleanStudent[key] = value.toISOString();
      }
    });
    
    return cleanStudent;
  }

  // Actualizar múltiples sujetos (para actualización masiva)
  static async updateMultipleStudents(students) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return { success: false, count: 0 };
      }

      // Usar batch para operaciones en lote (máximo 500 operaciones por batch)
      const batchSize = 450; // Dejamos margen para no llegar al límite de 500
      let operationsCount = 0;
      let currentBatch = writeBatch(firestore);
      let updatedCount = 0;
      
      // Procesar cada sujeto
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        if (student.id) {
          // Si tiene ID, actualizar directamente
          const docRef = doc(firestore, STUDENTS_COLLECTION, student.id);
          const { id, ...data } = student;
          currentBatch.update(docRef, data);
          updatedCount++;
        } else if (student.Documento) {
          // Si no tiene ID pero sí documento, buscar por documento y actualizar
          try {
            const existingStudent = await this.getStudentByDocumento(student.Documento);
            if (existingStudent) {
              const docRef = doc(firestore, STUDENTS_COLLECTION, existingStudent.id);
              currentBatch.update(docRef, student);
              updatedCount++;
            } else {
              // Si no existe, crear nuevo documento
              const docRef = doc(firestore, STUDENTS_COLLECTION, student.Documento);
              currentBatch.set(docRef, student);
              updatedCount++;
            }
          } catch (error) {
            console.error('Error al buscar sujeto por documento:', error);
            continue;
          }
        }
        
        operationsCount++;
        
        // Si alcanzamos el tamaño máximo del batch o es el último sujeto, ejecutar el batch
        if (operationsCount === batchSize || i === students.length - 1) {
          await currentBatch.commit();
          currentBatch = writeBatch(firestore);
          operationsCount = 0;
        }
      }
      
      return { success: true, count: updatedCount };
    } catch (error) {
      console.error('Error al actualizar múltiples sujetos:', error);
      throw error;
    }
  }

  // Obtener todos los sujetos inactivos
  static async getAllInactiveStudents() {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return [];
      }

      const querySnapshot = await getDocs(collection(firestore, INACTIVE_STUDENTS_COLLECTION));
      const inactiveStudents = [];
      querySnapshot.forEach((doc) => {
        inactiveStudents.push({ id: doc.id, ...doc.data() });
      });
      return inactiveStudents;
    } catch (error) {
      console.error('Error al obtener sujetos inactivos:', error);
      throw error;
    }
  }

  // Verificar si existe un sujeto activo con el mismo nombre
  static async checkForDuplicateStudent(student) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      // Buscar sujetos con el mismo nombre completo
      const studentsRef = collection(firestore, STUDENTS_COLLECTION);
      const q = query(
        studentsRef, 
        where('Nombre Completo', '==', student['Nombre Completo'])
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Encontramos al menos un sujeto con el mismo nombre
        let existingStudent = null;
        querySnapshot.forEach((doc) => {
          existingStudent = { id: doc.id, ...doc.data() };
        });
        return existingStudent;
      }
      
      return null;
    } catch (error) {
      console.error('Error al verificar sujeto duplicado:', error);
      return null;
    }
  }

  // Restaurar un sujeto inactivo
  static async restoreInactiveStudent(id, mergeStrategy = null, customData = null) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return { success: false, error: 'Firebase no inicializado' };
      }

      // Primero obtenemos el sujeto inactivo
      const inactiveStudentRef = doc(firestore, INACTIVE_STUDENTS_COLLECTION, id);
      const inactiveStudentDoc = await getDoc(inactiveStudentRef);
      
      if (inactiveStudentDoc.exists()) {
        const inactiveStudentData = inactiveStudentDoc.data();
        
        // Asegurarse de que el estudiante tenga un hexId
        if (!inactiveStudentData.hexId) {
          inactiveStudentData.hexId = generateHexId();
        }
        
        // Eliminar metadatos de eliminación
        const activeStudent = {
          ...inactiveStudentData,
          inactiveSince: null,
          reason: null,
          Activo: true
        };
        
        // Verificar si ya existe un sujeto activo con el mismo nombre
        const existingStudent = await this.checkForDuplicateStudent(activeStudent);
        
        // Si existe un duplicado y no tenemos una estrategia de fusión, devolver ambos sujetos
        if (existingStudent && !mergeStrategy) {
          return {
            success: false,
            duplicate: true,
            inactiveStudent: { id, ...activeStudent },
            existingStudent
          };
        }
        
        // Si existe un duplicado y tenemos una estrategia de fusión, aplicarla
        if (existingStudent && mergeStrategy) {
          let mergedStudent = { ...existingStudent };
          
          // Aplicar la estrategia de fusión
          if (mergeStrategy === 'keepInactive') {
            // Mantener datos del sujeto inactivo
            mergedStudent = {
              ...mergedStudent,
              ...activeStudent,
              id: existingStudent.id
            };
          } else if (mergeStrategy === 'keepActive') {
            // Mantener datos del sujeto activo (no hacer nada)
          } else if (mergeStrategy === 'merge') {
            // Fusionar datos (campos no vacíos del inactivo tienen prioridad)
            Object.keys(activeStudent).forEach(key => {
              if (activeStudent[key] && 
                  activeStudent[key] !== '' && 
                  key !== 'id' && 
                  key !== 'inactiveSince' && 
                  key !== 'reason') {
                mergedStudent[key] = activeStudent[key];
              }
            });
          } else if (mergeStrategy === 'custom' && customData) {
            // Usar los datos personalizados proporcionados por el usuario
            mergedStudent = {
              ...mergedStudent,
              ...customData,
              id: existingStudent.id,
              Activo: true
            };
          }
          
          // Guardar el sujeto fusionado
          await setDoc(doc(firestore, STUDENTS_COLLECTION, existingStudent.id), mergedStudent);
          
          // Eliminar de la colección de inactivos
          await deleteDoc(inactiveStudentRef);
          
          return {
            success: true,
            merged: true,
            student: mergedStudent
          };
        }
        
        // Si no hay duplicado, simplemente restaurar
        await setDoc(doc(firestore, STUDENTS_COLLECTION, id), activeStudent);
        
        // Eliminar de la colección de inactivos
        await deleteDoc(inactiveStudentRef);
        
        return {
          success: true,
          student: { id, ...activeStudent }
        };
      }
      
      return {
        success: false,
        error: 'Sujeto inactivo no encontrado'
      };
    } catch (error) {
      console.error('Error al restaurar sujeto inactivo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Eliminar definitivamente un sujeto inactivo
  static async deleteInactiveStudentPermanently(id) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        throw new Error('Firebase no está inicializado');
      }

      console.log(`Eliminando permanentemente sujeto inactivo con ID: ${id}`);
      
      // Verificar que el sujeto exista en la colección de inactivos
      const docRef = doc(firestore, INACTIVE_STUDENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.warn(`No se encontró el sujeto inactivo con ID: ${id}`);
        throw new Error(`Sujeto inactivo con ID ${id} no encontrado`);
      }
      
      // Eliminar el documento
      await deleteDoc(docRef);
      console.log(`Sujeto inactivo con ID ${id} eliminado permanentemente`);
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar permanentemente sujeto inactivo con ID ${id}:`, error);
      throw error;
    }
  }
  
  // Eliminar definitivamente múltiples sujetos inactivos
  static async deleteInactiveStudentsBatch(students) {
    try {
      if (!students || !Array.isArray(students) || students.length === 0) {
        console.error('Estudiantes no válidos para eliminar definitivamente');
        return { success: false, error: 'Estudiantes no válidos' };
      }
      
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return { success: false, error: 'Firebase no inicializado' };
      }
      
      console.log('Eliminando definitivamente estudiantes inactivos en lote:', students);
      
      // Crear un batch para operaciones en lote
      const batch = writeBatch(firestore);
      
      // Contador de estudiantes procesados correctamente
      let processedCount = 0;
      
      // Agregar cada operación de eliminación al batch
      for (const student of students) {
        // Verificar que el estudiante tenga un ID
        if (!student || !student.id) {
          console.warn('Estudiante sin ID, no se puede eliminar:', student);
          continue;
        }
        
        console.log(`Añadiendo estudiante con ID ${student.id} al lote de eliminación`);
        const studentRef = doc(firestore, INACTIVE_STUDENTS_COLLECTION, student.id);
        batch.delete(studentRef);
        processedCount++;
      }
      
      if (processedCount === 0) {
        console.warn('No se encontraron estudiantes válidos para eliminar');
        return { success: false, error: 'No se encontraron estudiantes válidos' };
      }
      
      // Ejecutar el batch
      await batch.commit();
      console.log(`Batch completado: ${processedCount} estudiantes eliminados definitivamente`);
      
      return { success: true, count: processedCount };
    } catch (error) {
      console.error('Error al eliminar definitivamente estudiantes inactivos en lote:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  // Obtener todos los estudiantes inactivos
  static async getInactiveStudents() {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return [];
      }

      const querySnapshot = await getDocs(collection(firestore, INACTIVE_STUDENTS_COLLECTION));
      const inactiveStudents = [];
      querySnapshot.forEach((doc) => {
        inactiveStudents.push({ id: doc.id, ...doc.data() });
      });
      console.log(`Se encontraron ${inactiveStudents.length} estudiantes inactivos en Firebase`);
      return inactiveStudents;
    } catch (error) {
      console.error('Error al obtener estudiantes inactivos:', error);
      throw error;
    }
  }

  // Buscar sujetos por documento de identidad
  static async getStudentByDocumento(documento) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      const q = query(
        collection(firestore, STUDENTS_COLLECTION),
        where('Documento', '==', documento)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error al buscar sujeto por documento:', error);
      throw error;
    }
  }

  // Buscar estudiantes inactivos por documento de identidad
  static async getInactiveStudentByDocumento(documento) {
    try {
      const firestore = db();
      if (!firestore) {
        console.warn('Firebase no está inicializado o configurado correctamente');
        return null;
      }

      console.log(`Buscando estudiante inactivo con documento: ${documento}`);
      
      // Crear una consulta para buscar el estudiante inactivo por su documento
      const q = query(
        collection(firestore, INACTIVE_STUDENTS_COLLECTION),
        where('Documento', '==', documento)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`No se encontró ningún estudiante inactivo con documento: ${documento}`);
        return null;
      }
      
      // Devolver el primer estudiante encontrado con ese documento
      const doc = querySnapshot.docs[0];
      console.log(`Estudiante inactivo encontrado con documento ${documento}, ID: ${doc.id}`);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error al buscar estudiante inactivo con documento ${documento}:`, error);
      throw error;
    }
  }

  // ==================== SERVICIOS PARA FAMILIAS ====================

  /**
   * Añade una nueva familia a Firestore
   * @param {Object} familia - Datos de la familia a añadir
   * @returns {Promise<string>} - ID de la familia creada
   */
  static async addFamilia(familia) {
    try {
      const familiaConTimestamp = {
        ...familia,
        fechaCreacion: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db(), FAMILIAS_COLLECTION), familiaConTimestamp);
      console.log(`Familia añadida con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error al añadir familia:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de una familia existente
   * @param {string} id - ID de la familia a actualizar
   * @param {Object} data - Datos actualizados de la familia
   * @returns {Promise<void>}
   */
  static async updateFamilia(id, data) {
    try {
      const dataConTimestamp = {
        ...data,
        fechaActualizacion: new Date().toISOString()
      };
      
      await updateDoc(doc(db(), FAMILIAS_COLLECTION, id), dataConTimestamp);
      console.log(`Familia con ID ${id} actualizada correctamente`);
    } catch (error) {
      console.error(`Error al actualizar familia con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las familias
   * @param {boolean} [soloActivas=true] - Si es true, solo devuelve familias activas
   * @returns {Promise<Array>} - Array de familias
   */
  static async getFamilias(soloActivas = true) {
    try {
      let familiaQuery;
      const familiaCollection = collection(db(), FAMILIAS_COLLECTION);
      
      if (soloActivas) {
        familiaQuery = query(familiaCollection, where('activo', '==', true));
      } else {
        familiaQuery = familiaCollection;
      }
      
      const snapshot = await getDocs(familiaQuery);
      const familias = [];
      
      snapshot.forEach(doc => {
        familias.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return familias;
    } catch (error) {
      console.error('Error al obtener familias:', error);
      throw error;
    }
  }

  /**
   * Obtiene una familia por su ID
   * @param {string} id - ID de la familia
   * @returns {Promise<Object|null>} - Datos de la familia o null si no existe
   */
  static async getFamiliaById(id) {
    try {
      const doc = await getDoc(doc(db(), FAMILIAS_COLLECTION, id));
      
      if (doc.exists()) {
        return {
          id: doc.id,
          ...doc.data()
        };
      } else {
        console.log(`No se encontró familia con ID ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener familia con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la familia a la que pertenece un estudiante
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Object|null>} - Datos de la familia o null si no existe
   */
  static async getFamiliaByEstudiante(documentoEstudiante) {
    try {
      const snapshot = await getDocs(
        query(
          collection(db(), FAMILIAS_COLLECTION),
          where('miembros', 'array-contains', { documentoEstudiante })
        )
      );
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      } else {
        console.log(`No se encontró familia para el estudiante con documento ${documentoEstudiante}`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener familia para estudiante con documento ${documentoEstudiante}:`, error);
      throw error;
    }
  }

  /**
   * Asocia un estudiante a una familia
   * @param {string} familiaId - ID de la familia
   * @param {Object} estudiante - Datos del estudiante a asociar
   * @returns {Promise<void>}
   */
  static async asociarEstudianteAFamilia(familiaId, estudiante) {
    try {
      const miembro = {
        documentoEstudiante: estudiante.Documento,
        nombreCompleto: estudiante['Nombre Completo'] || estudiante.NombreCompleto || `${estudiante.Nombre || ''} ${estudiante.Apellido || ''}`.trim(),
        relacion: estudiante.relacion || 'No especificada'
      };
      
      console.log('Asociando estudiante a familia:', { familiaId, miembro });
      
      await updateDoc(doc(db(), FAMILIAS_COLLECTION, familiaId), {
        miembros: arrayUnion(miembro)
      });
      
      console.log(`Estudiante con documento ${estudiante.Documento} asociado a familia ${familiaId}`);
    } catch (error) {
      console.error(`Error al asociar estudiante a familia ${familiaId}:`, error);
      throw error;
    }
  }

  /**
   * Desasocia un estudiante de una familia
   * @param {string} familiaId - ID de la familia
   * @param {string} documentoEstudiante - Documento del estudiante a desasociar
   * @returns {Promise<void>}
   */
  static async desasociarEstudianteDeFamilia(familiaId, documentoEstudiante) {
    try {
      // Primero obtenemos la familia para encontrar el miembro exacto a eliminar
      const familia = await this.getFamiliaById(familiaId);
      
      if (!familia) {
        throw new Error(`No se encontró familia con ID ${familiaId}`);
      }
      
      const miembroAEliminar = familia.miembros.find(
        m => m.documentoEstudiante === documentoEstudiante
      );
      
      if (!miembroAEliminar) {
        throw new Error(`El estudiante con documento ${documentoEstudiante} no pertenece a esta familia`);
      }
      
      await updateDoc(doc(db(), FAMILIAS_COLLECTION, familiaId), {
        miembros: arrayRemove(miembroAEliminar)
      });
      
      console.log(`Estudiante con documento ${documentoEstudiante} desasociado de familia ${familiaId}`);
    } catch (error) {
      console.error(`Error al desasociar estudiante de familia ${familiaId}:`, error);
      throw error;
    }
  }

  // ==================== SERVICIOS PARA INTERVENCIONES INDIVIDUALES ====================

  /**
   * Añade una nueva intervención individual
   * @param {Object} intervencion - Datos de la intervención a añadir
   * @returns {Promise<string>} - ID de la intervención creada
   */
  static async addIntervencionIndividual(intervencion) {
    try {
      const intervencionConTimestamp = {
        ...intervencion,
        fecha: intervencion.fecha || new Date().toISOString(),
        fechaCreacion: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db(), INTERVENCIONES_INDIVIDUALES_COLLECTION), intervencionConTimestamp);
      console.log(`Intervención individual añadida con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error al añadir intervención individual:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de una intervención individual existente
   * @param {string} id - ID de la intervención a actualizar
   * @param {Object} data - Datos actualizados de la intervención
   * @returns {Promise<void>}
   */
  static async updateIntervencionIndividual(id, data) {
    try {
      const dataConTimestamp = {
        ...data,
        fechaActualizacion: new Date().toISOString()
      };
      
      await updateDoc(doc(db(), INTERVENCIONES_INDIVIDUALES_COLLECTION, id), dataConTimestamp);
      console.log(`Intervención individual con ID ${id} actualizada correctamente`);
    } catch (error) {
      console.error(`Error al actualizar intervención individual con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene intervenciones individuales con filtros opcionales
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async getIntervencionesIndividuales(filtros = {}) {
    try {
      let q = collection(db(), INTERVENCIONES_INDIVIDUALES_COLLECTION);
      let constraints = [];
      
      // Aplicar filtros
      if (filtros.documentoEstudiante) {
        constraints.push(where('documentoEstudiante', '==', filtros.documentoEstudiante));
      }
      
      if (filtros.tipo) {
        constraints.push(where('tipo', '==', filtros.tipo));
      }
      
      if (filtros.estado) {
        constraints.push(where('estado', '==', filtros.estado));
      }
      
      if (filtros.registradoPorId) {
        constraints.push(where('registradoPor.id', '==', filtros.registradoPorId));
      }
      
      // Ordenar por fecha descendente (más reciente primero)
      constraints.push(orderBy('fecha', 'desc'));
      
      // Aplicar restricciones a la consulta
      q = query(q, ...constraints);
      
      const snapshot = await getDocs(q);
      const intervenciones = [];
      
      snapshot.forEach(doc => {
        intervenciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return intervenciones;
    } catch (error) {
      console.error('Error al obtener intervenciones individuales:', error);
      throw error;
    }
  }

  /**
   * Obtiene intervenciones individuales de un estudiante específico
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async getIntervencionesIndividualesByEstudiante(documentoEstudiante) {
    try {
      return await this.getIntervencionesIndividuales({ documentoEstudiante });
    } catch (error) {
      console.error(`Error al obtener intervenciones para estudiante ${documentoEstudiante}:`, error);
      throw error;
    }
  }

  // ==================== SERVICIOS PARA INTERVENCIONES FAMILIARES ====================

  /**
   * Añade una nueva intervención familiar
   * @param {Object} intervencion - Datos de la intervención a añadir
   * @returns {Promise<string>} - ID de la intervención creada
   */
  static async addIntervencionFamiliar(intervencion) {
    try {
      const intervencionConTimestamp = {
        ...intervencion,
        fecha: intervencion.fecha || new Date().toISOString(),
        fechaCreacion: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db(), INTERVENCIONES_FAMILIARES_COLLECTION), intervencionConTimestamp);
      console.log(`Intervención familiar añadida con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error al añadir intervención familiar:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de una intervención familiar existente
   * @param {string} id - ID de la intervención a actualizar
   * @param {Object} data - Datos actualizados de la intervención
   * @returns {Promise<void>}
   */
  static async updateIntervencionFamiliar(id, data) {
    try {
      const dataConTimestamp = {
        ...data,
        fechaActualizacion: new Date().toISOString()
      };
      
      await updateDoc(doc(db(), INTERVENCIONES_FAMILIARES_COLLECTION, id), dataConTimestamp);
      console.log(`Intervención familiar con ID ${id} actualizada correctamente`);
    } catch (error) {
      console.error(`Error al actualizar intervención familiar con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene intervenciones familiares con filtros opcionales
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async getIntervencionesFamiliares(filtros = {}) {
    try {
      let q = collection(db(), INTERVENCIONES_FAMILIARES_COLLECTION);
      let constraints = [];
      
      // Aplicar filtros
      if (filtros.familiaId) {
        constraints.push(where('familiaId', '==', filtros.familiaId));
      }
      
      if (filtros.tipo) {
        constraints.push(where('tipo', '==', filtros.tipo));
      }
      
      if (filtros.estado) {
        constraints.push(where('estado', '==', filtros.estado));
      }
      
      if (filtros.registradoPorId) {
        constraints.push(where('registradoPor.id', '==', filtros.registradoPorId));
      }
      
      // Ordenar por fecha descendente (más reciente primero)
      constraints.push(orderBy('fecha', 'desc'));
      
      // Aplicar restricciones a la consulta
      q = query(q, ...constraints);
      
      const snapshot = await getDocs(q);
      const intervenciones = [];
      
      snapshot.forEach(doc => {
        intervenciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return intervenciones;
    } catch (error) {
      console.error('Error al obtener intervenciones familiares:', error);
      throw error;
    }
  }

  /**
   * Obtiene intervenciones familiares de una familia específica
   * @param {string} familiaId - ID de la familia
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async getIntervencionesFamiliaresByFamilia(familiaId) {
    try {
      return await this.getIntervencionesFamiliares({ familiaId });
    } catch (error) {
      console.error(`Error al obtener intervenciones para familia ${familiaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene intervenciones familiares en las que participó un estudiante específico
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async getIntervencionesFamiliaresByEstudiante(documentoEstudiante) {
    try {
      const q = query(
        collection(db(), INTERVENCIONES_FAMILIARES_COLLECTION),
        where('miembrosPresentes', 'array-contains', { documentoEstudiante }),
        orderBy('fecha', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const intervenciones = [];
      
      snapshot.forEach(doc => {
        intervenciones.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return intervenciones;
    } catch (error) {
      console.error(`Error al obtener intervenciones familiares para estudiante ${documentoEstudiante}:`, error);
      throw error;
    }
  }
}

// Exportar todos los servicios
export default {
  // Métodos de inicialización
  isInitialized: FirebaseService.isInitialized,
  
  // Servicios para estudiantes activos
  addStudent: FirebaseService.addStudent,
  updateStudent: FirebaseService.updateStudent,
  deleteStudent: FirebaseService.deleteStudent,
  getAllStudents: FirebaseService.getAllStudents,
  getStudentById: FirebaseService.getStudentByDocumento,
  getStudentByDocumento: FirebaseService.getStudentByDocumento,
  
  // Servicios para estudiantes inactivos
  addInactiveStudent: FirebaseService.addInactiveStudent,
  getAllInactiveStudents: FirebaseService.getAllInactiveStudents,
  getInactiveStudentById: FirebaseService.getInactiveStudentByDocumento,
  getInactiveStudentByDocumento: FirebaseService.getInactiveStudentByDocumento,
  deleteInactiveStudentPermanently: FirebaseService.deleteInactiveStudentPermanently,
  restoreInactiveStudent: FirebaseService.restoreInactiveStudent,
  
  // Servicios para familias
  addFamilia: FirebaseService.addFamilia,
  updateFamilia: FirebaseService.updateFamilia,
  getFamilias: FirebaseService.getFamilias,
  getFamiliaById: FirebaseService.getFamiliaById,
  getFamiliaByEstudiante: FirebaseService.getFamiliaByEstudiante,
  asociarEstudianteAFamilia: FirebaseService.asociarEstudianteAFamilia,
  desasociarEstudianteDeFamilia: FirebaseService.desasociarEstudianteDeFamilia,
  
  // Servicios para intervenciones individuales
  addIntervencionIndividual: FirebaseService.addIntervencionIndividual,
  updateIntervencionIndividual: FirebaseService.updateIntervencionIndividual,
  getIntervencionesIndividuales: FirebaseService.getIntervencionesIndividuales,
  getIntervencionesIndividualesByEstudiante: FirebaseService.getIntervencionesIndividualesByEstudiante,
  
  // Servicios para intervenciones familiares
  addIntervencionFamiliar: FirebaseService.addIntervencionFamiliar,
  updateIntervencionFamiliar: FirebaseService.updateIntervencionFamiliar,
  getIntervencionesFamiliares: FirebaseService.getIntervencionesFamiliares,
  getIntervencionesFamiliaresByFamilia: FirebaseService.getIntervencionesFamiliaresByFamilia,
  getIntervencionesFamiliaresByEstudiante: FirebaseService.getIntervencionesFamiliaresByEstudiante
};
