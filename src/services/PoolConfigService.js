/**
 * Servicio para gestionar la configuración de los días de piscina
 */
const PoolConfigService = {
  /**
   * Obtiene los días de piscina configurados
   * @returns {Array} Array de objetos con id y nombre de los días configurados
   */
  getPoolDays: () => {
    try {
      const savedDays = localStorage.getItem('poolDays');
      if (savedDays) {
        const dayIds = JSON.parse(savedDays);
        return mapDayIdsToNames(dayIds);
      } else {
        // Por defecto, establecer lunes y jueves como días de piscina
        return mapDayIdsToNames([1, 4]);
      }
    } catch (error) {
      console.error('Error al cargar los días de piscina:', error);
      return mapDayIdsToNames([1, 4]); // Valores por defecto en caso de error
    }
  },

  /**
   * Obtiene los nombres de los días de piscina configurados
   * @returns {Array} Array de strings con los nombres de los días
   */
  getPoolDayNames: () => {
    const poolDays = PoolConfigService.getPoolDays();
    return poolDays.map(day => day.name);
  },

  /**
   * Verifica si un día específico está configurado como día de piscina
   * @param {string} dayName - Nombre del día a verificar
   * @returns {boolean} true si es día de piscina, false en caso contrario
   */
  isPoolDay: (dayName) => {
    const poolDayNames = PoolConfigService.getPoolDayNames();
    return poolDayNames.includes(dayName);
  },

  /**
   * Guarda la configuración de días de piscina
   * @param {Array} dayIds - Array de IDs de los días seleccionados
   * @returns {boolean} true si se guardó correctamente, false en caso contrario
   */
  savePoolDays: (dayIds) => {
    try {
      localStorage.setItem('poolDays', JSON.stringify(dayIds));
      return true;
    } catch (error) {
      console.error('Error al guardar los días de piscina:', error);
      return false;
    }
  }
};

/**
 * Mapea los IDs de los días a objetos con nombre e ID
 * @param {Array} dayIds - Array de IDs de días
 * @returns {Array} Array de objetos con id y nombre
 */
const mapDayIdsToNames = (dayIds) => {
  const weekdays = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' }
  ];
  
  return weekdays.filter(day => dayIds.includes(day.id));
};

export default PoolConfigService;
