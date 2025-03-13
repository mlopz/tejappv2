const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ruta al archivo Sipi.xls
const xlsFilePath = path.resolve(__dirname, '../../Sipi.xls');

// Leer el archivo
try {
  console.log('Leyendo archivo:', xlsFilePath);
  const workbook = XLSX.readFile(xlsFilePath);
  
  // Obtener nombres de las hojas
  const sheetNames = workbook.SheetNames;
  console.log('Hojas en el archivo:', sheetNames);
  
  // Analizar cada hoja
  sheetNames.forEach(sheetName => {
    console.log(`\n--- Analizando hoja: ${sheetName} ---`);
    
    // Convertir hoja a JSON
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    
    // Mostrar las primeras 10 filas para entender la estructura
    console.log('Primeras 10 filas:');
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      console.log(`Fila ${i}:`, jsonData[i]);
    }
    
    // Analizar dónde comienzan los datos reales (después de logos, títulos, etc.)
    let dataStartRow = -1;
    for (let i = 0; i < jsonData.length; i++) {
      // Buscar una fila que parezca un encabezado (tiene varios valores no nulos)
      const row = jsonData[i];
      if (row && row.filter(cell => cell !== null).length > 3) {
        console.log(`Posible fila de encabezado encontrada en la fila ${i}:`, row);
      }
    }
  });
  
} catch (error) {
  console.error('Error al procesar el archivo:', error);
}
