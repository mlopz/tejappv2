import { db as getDb } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { sampleStudents, sampleFamilies, sampleIntervencionesIndividuales, sampleIntervencionesFamiliares, sampleIntervencionesInstituciones } from './sampleData';
import { generateHexId } from './idGenerator';

// Constantes para nombres de colecciones (mismos nombres que en firebaseService.js)
const STUDENTS_COLLECTION = 'students';
const INACTIVE_STUDENTS_COLLECTION = 'inactive_students';
const FAMILIAS_COLLECTION = 'familias';
const INTERVENCIONES_INDIVIDUALES_COLLECTION = 'intervencionesIndividuales';
const INTERVENCIONES_FAMILIARES_COLLECTION = 'intervencionesFamiliares';
const INTERVENCIONES_INSTITUCIONES_COLLECTION = 'intervencionesInstituciones';

/**
 * Limpia una colección específica en Firestore
 * @param {Object} db - Instancia de Firestore
 * @param {string} collectionName - Nombre de la colección a limpiar
 * @returns {Promise} Promesa que se resuelve cuando se completa la operación
 */
const clearCollection = async (db, collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = [];
  
  querySnapshot.forEach((document) => {
    deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
  });
  
  await Promise.all(deletePromises);
  console.log(`Colección ${collectionName} limpiada (${querySnapshot.size} documentos eliminados).`);
};

/**
 * Limpia todas las colecciones de la base de datos y agrega datos de prueba
 * @returns {Promise} Promesa que se resuelve cuando se completa la operación
 */
export const resetDatabase = async () => {
  try {
    console.log('Verificando conexión a Firebase...');
    
    // Obtener la instancia de Firestore
    const db = getDb();
    
    // Verificar si Firebase está inicializado
    if (!db) {
      throw new Error('Firebase no está inicializado o está deshabilitado. Por favor, habilite Firebase en la configuración.');
    }
    
    console.log('Iniciando limpieza de la base de datos...');
    
    // Limpiar colecciones
    await clearCollection(db, STUDENTS_COLLECTION);
    await clearCollection(db, INACTIVE_STUDENTS_COLLECTION);
    await clearCollection(db, FAMILIAS_COLLECTION);
    await clearCollection(db, INTERVENCIONES_INDIVIDUALES_COLLECTION);
    await clearCollection(db, INTERVENCIONES_FAMILIARES_COLLECTION);
    await clearCollection(db, INTERVENCIONES_INSTITUCIONES_COLLECTION);
    
    console.log('Base de datos limpiada correctamente.');
    
    // Agregar datos de prueba
    console.log('Agregando datos de prueba...');
    
    // Separar estudiantes activos e inactivos
    const activeStudents = sampleStudents.filter(student => student.Activo === true);
    const inactiveStudents = sampleStudents.filter(student => student.Activo === false);
    
    // Agregar estudiantes activos
    for (const estudiante of activeStudents) {
      // Agregar un ID hexadecimal único a cada estudiante
      const estudianteConId = {
        ...estudiante,
        hexId: generateHexId()
      };
      // Usar addDoc para que Firestore genere un ID automático
      await addDoc(collection(db, STUDENTS_COLLECTION), estudianteConId);
    }
    console.log(`${activeStudents.length} estudiantes activos agregados.`);
    
    // Agregar estudiantes inactivos
    for (const estudiante of inactiveStudents) {
      // Agregar un ID hexadecimal único a cada estudiante
      const estudianteConId = {
        ...estudiante,
        hexId: generateHexId()
      };
      // Usar addDoc para que Firestore genere un ID automático
      await addDoc(collection(db, INACTIVE_STUDENTS_COLLECTION), estudianteConId);
    }
    console.log(`${inactiveStudents.length} estudiantes inactivos agregados.`);
    
    // Agregar familias
    for (const familia of sampleFamilies) {
      // Agregar un ID hexadecimal único a cada familia
      const familiaConId = {
        ...familia,
        hexId: generateHexId()
      };
      // Usar el ID existente o el hexId como ID del documento
      const docId = familia.id || familiaConId.hexId;
      await setDoc(doc(db, FAMILIAS_COLLECTION, docId), familiaConId);
    }
    console.log(`${sampleFamilies.length} familias agregadas.`);
    
    // Agregar intervenciones individuales
    for (const intervencion of sampleIntervencionesIndividuales) {
      // Agregar un ID hexadecimal único a cada intervención
      const intervencionConId = {
        ...intervencion,
        hexId: generateHexId()
      };
      // Usar el ID existente o el hexId como ID del documento
      const docId = intervencion.id || intervencionConId.hexId;
      await setDoc(doc(db, INTERVENCIONES_INDIVIDUALES_COLLECTION, docId), intervencionConId);
    }
    console.log(`${sampleIntervencionesIndividuales.length} intervenciones individuales agregadas.`);
    
    // Agregar intervenciones familiares
    for (const intervencion of sampleIntervencionesFamiliares) {
      // Agregar un ID hexadecimal único a cada intervención
      const intervencionConId = {
        ...intervencion,
        hexId: generateHexId()
      };
      // Usar el ID existente o el hexId como ID del documento
      const docId = intervencion.id || intervencionConId.hexId;
      await setDoc(doc(db, INTERVENCIONES_FAMILIARES_COLLECTION, docId), intervencionConId);
    }
    console.log(`${sampleIntervencionesFamiliares.length} intervenciones familiares agregadas.`);
    
    // Agregar intervenciones institucionales
    for (const intervencion of sampleIntervencionesInstituciones) {
      // Agregar un ID hexadecimal único a cada intervención
      const intervencionConId = {
        ...intervencion,
        hexId: generateHexId()
      };
      // Usar el ID existente o el hexId como ID del documento
      const docId = intervencion.id || intervencionConId.hexId;
      await setDoc(doc(db, INTERVENCIONES_INSTITUCIONES_COLLECTION, docId), intervencionConId);
    }
    console.log(`${sampleIntervencionesInstituciones.length} intervenciones institucionales agregadas.`);
    
    // Devolver resultado exitoso
    return {
      success: true,
      message: `Base de datos reiniciada correctamente con ${activeStudents.length} estudiantes activos, ${inactiveStudents.length} estudiantes inactivos, ${sampleFamilies.length} familias y ${sampleIntervencionesIndividuales.length + sampleIntervencionesFamiliares.length + sampleIntervencionesInstituciones.length} intervenciones.`
    };
    
  } catch (error) {
    console.error('Error al reiniciar la base de datos:', error);
    return {
      success: false,
      message: `Error al reiniciar la base de datos: ${error.message}`
    };
  }
};
