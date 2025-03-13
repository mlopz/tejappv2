import { useRef } from 'react';

// Contador global para asegurar IDs únicos a nivel de aplicación
let globalIdCounter = 0;

/**
 * Hook personalizado que genera un ID único para cada componente
 * @param {string} prefix - Prefijo opcional para el ID
 * @returns {string} ID único
 */
const useUniqueId = (prefix = 'id') => {
  const idRef = useRef(null);
  
  if (idRef.current === null) {
    // Generar un ID único combinando un timestamp, un número aleatorio y un contador global
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    globalIdCounter += 1;
    
    idRef.current = `${prefix}-${timestamp}-${random}-${globalIdCounter}`;
  }
  
  return idRef.current;
};

export default useUniqueId;
