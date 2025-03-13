import React from 'react';

const DebugPanel = ({ data }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      borderRadius: '5px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h5>Panel de Depuración</h5>
      <p>Estado de la aplicación:</p>
      <ul>
        <li>Estudiantes cargados: {Array.isArray(data) ? data.length : 'No es un array'}</li>
        <li>Tipo de datos: {typeof data}</li>
      </ul>
      {Array.isArray(data) && data.length > 0 && (
        <>
          <p>Primer estudiante:</p>
          <pre style={{ fontSize: '10px' }}>
            {JSON.stringify(data[0], null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};

export default DebugPanel;
