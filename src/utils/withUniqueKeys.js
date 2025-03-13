import React from 'react';
import useUniqueId from '../hooks/useUniqueId';

/**
 * HOC que garantiza claves únicas para los elementos de una lista
 * @param {React.Component} WrappedComponent - Componente a envolver
 * @returns {React.Component} Componente con claves únicas garantizadas
 */
const withUniqueKeys = (WrappedComponent) => {
  const WithUniqueKeys = (props) => {
    const uniquePrefix = useUniqueId('list');
    
    // Función para generar una clave única para cada elemento
    const generateUniqueKey = (item, index) => {
      // Si el elemento ya tiene una clave única, la usamos
      if (item && item._uniqueKey) {
        return item._uniqueKey;
      }
      
      // Generamos una clave única basada en el prefijo único y el índice
      return `${uniquePrefix}-${index}`;
    };
    
    // Función para procesar recursivamente los children y asignar claves únicas
    const processChildren = (children) => {
      if (!children) return children;
      
      return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        // Si el elemento es un array o tiene children, procesamos recursivamente
        if (child.props.children) {
          const newChildren = processChildren(child.props.children);
          return React.cloneElement(child, { key: generateUniqueKey(child, index), children: newChildren });
        }
        
        // Si el elemento no tiene children, simplemente le asignamos una clave única
        return React.cloneElement(child, { key: generateUniqueKey(child, index) });
      });
    };
    
    // Procesamos los children del componente envuelto
    const processedChildren = processChildren(props.children);
    
    // Devolvemos el componente envuelto con los children procesados
    return <WrappedComponent {...props} children={processedChildren} />;
  };
  
  WithUniqueKeys.displayName = `WithUniqueKeys(${getDisplayName(WrappedComponent)})`;
  return WithUniqueKeys;
};

// Función auxiliar para obtener el nombre de visualización del componente
const getDisplayName = (WrappedComponent) => {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

export default withUniqueKeys;
