/**
 * Genera un ID hexadecimal único
 * @param {number} length - Longitud del ID (por defecto 16 caracteres)
 * @returns {string} - ID hexadecimal único
 */
export const generateHexId = (length = 16) => {
  const characters = '0123456789abcdef';
  let result = '';
  
  // Agregar timestamp actual para mayor unicidad
  const timestamp = Date.now().toString(16);
  result += timestamp;
  
  // Completar con caracteres aleatorios hasta alcanzar la longitud deseada
  while (result.length < length) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  // Si el resultado es más largo que la longitud deseada, recortarlo
  return result.substring(0, length);
};
