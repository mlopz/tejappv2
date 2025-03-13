/**
 * Genera una clave única basada en un timestamp, un valor aleatorio y un identificador opcional
 * @param {string} identifier - Identificador opcional para hacer la clave más específica
 * @returns {string} Clave única
 */
export const generateUniqueKey = (identifier = '') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${identifier ? `${identifier}-` : ''}${timestamp}-${random}`;
};

/**
 * Genera una clave única para un elemento de una lista
 * @param {object} item - Elemento de la lista
 * @param {number} index - Índice del elemento en la lista
 * @param {string} prefix - Prefijo opcional para la clave
 * @returns {string} Clave única
 */
export const generateUniqueKeyForItem = (item, index, prefix = '') => {
  // Intentamos usar propiedades del elemento que podrían ser únicas
  const itemId = item?.id || item?.Documento || item?.documentoEstudiante || '';
  return `${prefix ? `${prefix}-` : ''}${itemId}-${index}-${generateUniqueKey()}`;
};
