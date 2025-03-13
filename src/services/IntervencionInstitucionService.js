import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

const INTERVENCIONES_INSTITUCIONES_COLLECTION = 'intervenciones_instituciones';

class IntervencionInstitucionService {
  // Crear una nueva intervención con institución
  static async createIntervencionInstitucion(intervencionData) {
    try {
      // Agregar timestamp de creación
      const dataWithTimestamp = {
        ...intervencionData,
        fechaCreacion: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION), dataWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear intervención con institución:', error);
      throw error;
    }
  }

  // Obtener todas las intervenciones con instituciones
  static async getAllIntervencionesInstituciones() {
    try {
      const q = query(
        collection(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener intervenciones con instituciones:', error);
      throw error;
    }
  }

  // Obtener una intervención con institución por su ID
  static async getIntervencionInstitucionById(id) {
    try {
      const docRef = doc(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        console.log('No existe la intervención con institución con ID:', id);
        return null;
      }
    } catch (error) {
      console.error('Error al obtener intervención con institución:', error);
      throw error;
    }
  }

  // Actualizar una intervención con institución
  static async updateIntervencionInstitucion(id, intervencionData) {
    try {
      const docRef = doc(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION, id);
      await updateDoc(docRef, intervencionData);
      return true;
    } catch (error) {
      console.error('Error al actualizar intervención con institución:', error);
      throw error;
    }
  }

  // Eliminar una intervención con institución
  static async deleteIntervencionInstitucion(id) {
    try {
      const docRef = doc(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error al eliminar intervención con institución:', error);
      throw error;
    }
  }

  // Obtener intervenciones con instituciones por estudiante
  static async getIntervencionesInstitucionesByEstudiante(documentoEstudiante) {
    try {
      const q = query(
        collection(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION),
        where('documentoEstudiante', '==', documentoEstudiante),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener intervenciones con instituciones por estudiante:', error);
      throw error;
    }
  }

  // Obtener intervenciones con instituciones por tipo de institución
  static async getIntervencionesInstitucionesByTipoInstitucion(tipoInstitucion) {
    try {
      const q = query(
        collection(db(), INTERVENCIONES_INSTITUCIONES_COLLECTION),
        where('tipoInstitucion', '==', tipoInstitucion),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener intervenciones con instituciones por tipo:', error);
      throw error;
    }
  }
}

export default IntervencionInstitucionService;
