import React, { useMemo } from 'react';

/**
 * Genera un ID único basado en timestamp y un valor aleatorio
 * @returns {string} ID único
 */
const generateUniqueId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
};

/**
 * Componente que garantiza claves únicas para todos los elementos de una lista
 * Este componente puede envolver cualquier lista (ul, ol, Table, List, etc.) y asegurará
 * que cada elemento tenga una clave única.
 */
const UniqueKeyList = ({ 
  component: Component, 
  items, 
  renderItem, 
  keyExtractor,
  ...rest 
}) => {
  // Generamos un ID único para esta instancia de la lista
  const listId = useMemo(() => generateUniqueId(), []);
  
  // Mapeamos los elementos con claves únicas garantizadas
  const itemsWithUniqueKeys = useMemo(() => {
    if (!items) return [];
    
    return items.map((item, index) => {
      // Si se proporciona un extractor de claves, lo usamos
      let key = keyExtractor ? keyExtractor(item, index) : null;
      
      // Si no hay clave o es potencialmente duplicada, generamos una clave única
      if (!key) {
        // Generamos una clave única basada en el ID de la lista, el índice y un timestamp
        key = `${listId}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      } else {
        // Si hay una clave, la hacemos única añadiendo el ID de la lista y el índice
        key = `${listId}-${index}-${key}`;
      }
      
      // Renderizamos el elemento con la clave única
      return renderItem(item, index, key);
    });
  }, [items, renderItem, keyExtractor, listId]);
  
  // Renderizamos el componente con los elementos con claves únicas
  return <Component {...rest}>{itemsWithUniqueKeys}</Component>;
};

export default UniqueKeyList;
