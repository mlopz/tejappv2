import FirebaseService from '../firebase/firebaseService';

/**
 * Servicio para gestionar intervenciones individuales
 */
class IntervencionIndividualService {
  /**
   * Crea una nueva intervención individual
   * @param {Object} intervencionData - Datos de la intervención a crear
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async createIntervencionIndividual(intervencionData) {
    try {
      console.log('Creando nueva intervención individual:', intervencionData);
      
      // Validar datos mínimos
      if (!intervencionData.documentoEstudiante) {
        throw new Error('El documento del estudiante es obligatorio');
      }
      
      if (!intervencionData.descripcion) {
        throw new Error('La descripción de la intervención es obligatoria');
      }
      
      // Asegurar que tenga los campos necesarios
      const intervencion = {
        ...intervencionData,
        fecha: intervencionData.fecha || new Date().toISOString(),
        estado: intervencionData.estado || 'pendiente'
      };
      
      const intervencionId = await FirebaseService.addIntervencionIndividual(intervencion);
      console.log(`Intervención individual creada con ID: ${intervencionId}`);
      
      return {
        success: true,
        id: intervencionId,
        intervencion: {
          id: intervencionId,
          ...intervencion
        }
      };
    } catch (error) {
      console.error('Error al crear intervención individual:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza una intervención individual existente
   * @param {string} id - ID de la intervención a actualizar
   * @param {Object} data - Datos actualizados de la intervención
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async updateIntervencionIndividual(id, data) {
    try {
      console.log(`Actualizando intervención individual con ID ${id}:`, data);
      
      await FirebaseService.updateIntervencionIndividual(id, data);
      console.log(`Intervención individual con ID ${id} actualizada correctamente`);
      
      return {
        success: true,
        id
      };
    } catch (error) {
      console.error(`Error al actualizar intervención individual con ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Carga intervenciones individuales con filtros opcionales
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async loadIntervencionesIndividuales(filtros = {}) {
    try {
      console.log('Cargando intervenciones individuales con filtros:', filtros);
      
      const intervenciones = await FirebaseService.getIntervencionesIndividuales(filtros);
      console.log(`Se cargaron ${intervenciones.length} intervenciones individuales`);
      
      return intervenciones;
    } catch (error) {
      console.error('Error al cargar intervenciones individuales:', error);
      throw error;
    }
  }
  
  /**
   * Carga intervenciones individuales de un estudiante específico
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async loadIntervencionesIndividualesByEstudiante(documentoEstudiante) {
    try {
      console.log(`Cargando intervenciones individuales para estudiante con documento ${documentoEstudiante}`);
      
      const intervenciones = await FirebaseService.getIntervencionesIndividualesByEstudiante(documentoEstudiante);
      console.log(`Se cargaron ${intervenciones.length} intervenciones individuales para el estudiante`);
      
      return intervenciones;
    } catch (error) {
      console.error(`Error al cargar intervenciones individuales para estudiante ${documentoEstudiante}:`, error);
      throw error;
    }
  }
}

export default IntervencionIndividualService;
