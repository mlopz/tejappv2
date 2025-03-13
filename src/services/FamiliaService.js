import FirebaseService from '../firebase/firebaseService';

/**
 * Servicio para gestionar familias
 */
class FamiliaService {
  /**
   * Crea una nueva familia
   * @param {Object} familiaData - Datos de la familia a crear
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async createFamilia(familiaData) {
    try {
      console.log('Creando nueva familia:', familiaData);
      
      // Validar datos mínimos
      if (!familiaData.nombre) {
        throw new Error('El nombre de la familia es obligatorio');
      }
      
      // Asegurar que tenga el campo activo
      const familia = {
        ...familiaData,
        activo: true,
        creadoPor: familiaData.creadoPor || 'sistema'
      };
      
      const familiaId = await FirebaseService.addFamilia(familia);
      console.log(`Familia creada con ID: ${familiaId}`);
      
      return {
        success: true,
        id: familiaId,
        familia: {
          id: familiaId,
          ...familia
        }
      };
    } catch (error) {
      console.error('Error al crear familia:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza una familia existente
   * @param {string} id - ID de la familia a actualizar
   * @param {Object} data - Datos actualizados de la familia
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async updateFamilia(id, data) {
    try {
      console.log(`Actualizando familia con ID ${id}:`, data);
      
      await FirebaseService.updateFamilia(id, data);
      console.log(`Familia con ID ${id} actualizada correctamente`);
      
      return {
        success: true,
        id
      };
    } catch (error) {
      console.error(`Error al actualizar familia con ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Carga todas las familias con filtros opcionales
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<Array>} - Array de familias
   */
  static async loadFamilias(filtros = {}) {
    try {
      console.log('Cargando familias con filtros:', filtros);
      
      const familias = await FirebaseService.getFamilias(filtros.soloActivas !== false);
      console.log(`Se cargaron ${familias.length} familias`);
      
      // Aplicar filtros adicionales
      let familiasFiltradas = [...familias];
      
      if (filtros.nombre) {
        const nombreLower = filtros.nombre.toLowerCase();
        familiasFiltradas = familiasFiltradas.filter(f => 
          f.nombre.toLowerCase().includes(nombreLower)
        );
      }
      
      return familiasFiltradas;
    } catch (error) {
      console.error('Error al cargar familias:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene una familia por su ID
   * @param {string} id - ID de la familia
   * @returns {Promise<Object>} - Familia encontrada o null
   */
  static async getFamiliaById(id) {
    try {
      console.log(`Buscando familia con ID ${id}`);
      
      const familia = await FirebaseService.getFamiliaById(id);
      console.log(`Familia con ID ${id} encontrada:`, familia ? 'Sí' : 'No');
      
      return familia;
    } catch (error) {
      console.error(`Error al buscar familia con ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene la familia asociada a un estudiante
   * @param {string} documentoEstudiante - Documento del estudiante
   * @returns {Promise<Object>} - Familia encontrada o null
   */
  static async getFamiliaByEstudiante(documentoEstudiante) {
    try {
      console.log(`Buscando familia para estudiante con documento ${documentoEstudiante}`);
      
      const familia = await FirebaseService.getFamiliaByEstudiante(documentoEstudiante);
      console.log(`Familia para estudiante ${documentoEstudiante} encontrada:`, familia ? 'Sí' : 'No');
      
      return familia;
    } catch (error) {
      console.error(`Error al buscar familia para estudiante ${documentoEstudiante}:`, error);
      throw error;
    }
  }
  
  /**
   * Asocia un estudiante a una familia
   * @param {string} familiaId - ID de la familia
   * @param {Object} estudiante - Estudiante a asociar
   * @param {string} relacion - Relación del estudiante con la familia
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async asociarEstudianteAFamilia(familiaId, estudiante, relacion = 'No especificada') {
    try {
      console.log(`Asociando estudiante con documento ${estudiante.Documento} a familia ${familiaId}`, estudiante);
      
      // Preparar objeto de miembro
      const miembro = {
        documentoEstudiante: estudiante.Documento,
        nombreCompleto: estudiante['Nombre Completo'] || 
                        estudiante.NombreCompleto || 
                        `${estudiante.Nombre || ''} ${estudiante.Apellido || ''}`.trim(),
        relacion
      };
      
      console.log('Datos del miembro a asociar:', miembro);
      
      // Pasar el estudiante directamente a Firebase
      await FirebaseService.asociarEstudianteAFamilia(familiaId, estudiante);
      console.log(`Estudiante asociado a familia ${familiaId}`);
      
      return {
        success: true,
        familiaId,
        documentoEstudiante: estudiante.Documento
      };
    } catch (error) {
      console.error(`Error al asociar estudiante a familia ${familiaId}:`, error);
      throw error;
    }
  }
  
  /**
   * Desasocia un estudiante de una familia
   * @param {string} familiaId - ID de la familia
   * @param {string} documentoEstudiante - Documento del estudiante a desasociar
   * @returns {Promise<Object>} - Resultado de la operación
   */
  static async desasociarEstudianteDeFamilia(familiaId, documentoEstudiante) {
    try {
      console.log(`Desasociando estudiante con documento ${documentoEstudiante} de familia ${familiaId}`);
      
      await FirebaseService.desasociarEstudianteDeFamilia(familiaId, documentoEstudiante);
      console.log(`Estudiante desasociado de familia ${familiaId}`);
      
      return {
        success: true,
        familiaId,
        documentoEstudiante
      };
    } catch (error) {
      console.error(`Error al desasociar estudiante de familia ${familiaId}:`, error);
      throw error;
    }
  }
}

export default FamiliaService;
