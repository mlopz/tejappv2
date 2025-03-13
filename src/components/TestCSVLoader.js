import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const TestCSVLoader = () => {
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Intentar cargar el CSV directamente
    fetch('/Database.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al cargar el archivo: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(csvText => {
        console.log('CSV cargado, longitud:', csvText.length);
        
        // Parsear el CSV
        Papa.parse(csvText, {
          header: true,
          delimiter: ';',
          skipEmptyLines: true,
          complete: (results) => {
            console.log('Datos parseados:', results);
            setCsvData(results.data);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error al parsear:', error);
            setError(`Error al parsear: ${error.message}`);
            setLoading(false);
          }
        });
      })
      .catch(err => {
        console.error('Error en fetch:', err);
        setError(`Error en fetch: ${err.message}`);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Cargando CSV...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error al cargar los datos</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Prueba de Carga de CSV</h3>
      <div className="alert alert-success">
        CSV cargado correctamente. {csvData.length} registros encontrados.
      </div>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        <table className="table table-striped table-sm">
          <thead>
            <tr>
              {csvData.length > 0 && Object.keys(csvData[0]).map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csvData.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted">Mostrando los primeros 5 registros</p>
    </div>
  );
};

export default TestCSVLoader;
