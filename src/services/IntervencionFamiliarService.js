import FirebaseService from '../firebase/firebaseService';

/**
 * Servicio para gestionar intervenciones familiares
 */
class IntervencionFamiliarService {
  /**
   * Crea una nueva intervención familiar
   * @param {Object} intervencionData - Datos de la intervención a crear
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async createIntervencionFamiliar(intervencionData) {
    try {
      console.log('Creando nueva intervención familiar:', intervencionData);
      
      // Validar datos mínimos
      if (!intervencionData.familiaId) {
        throw new Error('El ID de la familia es obligatorio');
      }
      
      if (!intervencionData.descripcion) {
        throw new Error('La descripción de la intervención es obligatoria');
      }
      
      // Asegurar que tenga los campos necesarios
      const intervencion = {
        ...intervencionData,
        fecha: intervencionData.fecha || new Date().toISOString(),
        estado: intervencionData.estado || 'pendiente',
        miembrosPresentes: intervencionData.miembrosPresentes || []
      };
      
      const intervencionId = await FirebaseService.addIntervencionFamiliar(intervencion);
      console.log(`Intervención familiar creada con ID: ${intervencionId}`);
      
      return {
        success: true,
        id: intervencionId,
        intervencion: {
          id: intervencionId,
          ...intervencion
        }
      };
    } catch (error) {
      console.error('Error al crear intervención familiar:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza una intervención familiar existente
   * @param {string} id - ID de la intervención a actualizar
   * @param {Object} data - Datos actualizados de la intervención
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async updateIntervencionFamiliar(id, data) {
    try {
      console.log(`Actualizando intervención familiar con ID ${id}:`, data);
      
      await FirebaseService.updateIntervencionFamiliar(id, data);
      console.log(`Intervención familiar con ID ${id} actualizada correctamente`);
      
      return {
        success: true,
        id
      };
    } catch (error) {
      console.error(`Error al actualizar intervención familiar con ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Carga intervenciones familiares con filtros opcionales
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async loadIntervencionesFamiliares(filtros = {}) {
    try {
      console.log('Cargando intervenciones familiares con filtros:', filtros);
      
      const intervenciones = await FirebaseService.getIntervencionesFamiliares(filtros);
      console.log(`Se cargaron ${intervenciones.length} intervenciones familiares`);
      
      return intervenciones;
    } catch (error) {
      console.error('Error al cargar intervenciones familiares:', error);
      throw error;
    }
  }
  
  /**
   * Carga intervenciones familiares de una familia específica
   * @param {string} familiaId - ID de la familia
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async loadIntervencionesFamiliaresByFamilia(familiaId) {
    try {
      console.log(`Cargando intervenciones familiares para familia con ID ${familiaId}`);
      
      const intervenciones = await FirebaseService.getIntervencionesFamiliaresByFamilia(familiaId);
      console.log(`Se cargaron ${intervenciones.length} intervenciones familiares para la familia`);
      
      return intervenciones;
    } catch (error) {
      console.error(`Error al cargar intervenciones familiares para familia ${familiaId}:`, error);
      throw error;
    }
  }
  
  /**
   * Carga intervenciones familiares en las que participó un estudiante específico
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Array>} - Array de intervenciones
   */
  static async loadIntervencionesFamiliaresByEstudiante(documentoEstudiante) {
    try {
      console.log(`Cargando intervenciones familiares para estudiante con documento ${documentoEstudiante}`);
      
      const intervenciones = await FirebaseService.getIntervencionesFamiliaresByEstudiante(documentoEstudiante);
      console.log(`Se cargaron ${intervenciones.length} intervenciones familiares para el estudiante`);
      
      return intervenciones;
    } catch (error) {
      console.error(`Error al cargar intervenciones familiares para estudiante ${documentoEstudiante}:`, error);
      throw error;
    }
  }
}

export default IntervencionFamiliarService;
