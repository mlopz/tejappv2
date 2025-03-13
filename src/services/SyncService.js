import FirebaseService from '../firebase/firebaseService';
import { generateHexId } from '../utils/idGenerator';

class SyncService {
  // Claves para localStorage
  static PENDING_OPERATIONS_KEY = 'tejanitos_pending_operations';
  static SYNC_STATUS_KEY = 'tejanitos_sync_status';
  
  // Estados de sincronización
  static STATUS = {
    SYNCED: 'synced',
    PENDING: 'pending',
    SYNCING: 'syncing',
    ERROR: 'error'
  };
  
  // Tipos de operaciones
  static OPERATION_TYPES = {
    ADD: 'add',
    UPDATE: 'update',
    DELETE: 'delete',
    BATCH_UPDATE: 'batch_update',
    IMPORT: 'import'
  };
  
  // Estado actual de sincronización
  static currentStatus = SyncService.STATUS.SYNCED;
  
  // Callbacks para notificar cambios de estado
  static statusChangeCallbacks = [];
  
  // Inicializar el servicio
  static initialize() {
    // Cargar operaciones pendientes
    this.loadPendingOperations();
    
    // Configurar detector de conexión
    this.setupConnectionDetector();
    
    // Intentar sincronizar operaciones pendientes al inicio
    this.syncPendingOperations();
  }
  
  // Configurar detector de conexión
  static setupConnectionDetector() {
    // Detectar cambios en la conexión
    window.addEventListener('online', () => {
      console.log('Conexión a internet recuperada');
      this.syncPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      console.log('Conexión a internet perdida');
      this.updateStatus(this.STATUS.PENDING);
    });
  }
  
  // Registrar callback para cambios de estado
  static registerStatusChangeCallback(callback) {
    this.statusChangeCallbacks.push(callback);
  }
  
  // Eliminar callback
  static unregisterStatusChangeCallback(callback) {
    this.statusChangeCallbacks = this.statusChangeCallbacks.filter(cb => cb !== callback);
  }
  
  // Actualizar estado y notificar a los listeners
  static updateStatus(status) {
    this.currentStatus = status;
    localStorage.setItem(this.SYNC_STATUS_KEY, status);
    
    // Notificar a todos los callbacks registrados
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error en callback de cambio de estado:', error);
      }
    });
  }
  
  // Obtener estado actual
  static getStatus() {
    return this.currentStatus;
  }
  
  // Cargar operaciones pendientes desde localStorage
  static loadPendingOperations() {
    try {
      const pendingOperationsJson = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      const pendingOperations = pendingOperationsJson ? JSON.parse(pendingOperationsJson) : [];
      
      // Si hay operaciones pendientes, actualizar el estado
      if (pendingOperations.length > 0) {
        this.updateStatus(this.STATUS.PENDING);
      } else {
        this.updateStatus(this.STATUS.SYNCED);
      }
      
      return pendingOperations;
    } catch (error) {
      console.error('Error al cargar operaciones pendientes:', error);
      return [];
    }
  }
  
  // Guardar operaciones pendientes en localStorage
  static savePendingOperations(operations) {
    try {
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, JSON.stringify(operations));
      
      // Actualizar estado según si hay operaciones pendientes
      if (operations.length > 0) {
        this.updateStatus(this.STATUS.PENDING);
      } else {
        this.updateStatus(this.STATUS.SYNCED);
      }
    } catch (error) {
      console.error('Error al guardar operaciones pendientes:', error);
    }
  }
  
  // Agregar una operación pendiente
  static addPendingOperation(type, data) {
    const pendingOperations = this.loadPendingOperations();
    
    // Crear nueva operación
    const newOperation = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Agregar a la lista y guardar
    pendingOperations.push(newOperation);
    this.savePendingOperations(pendingOperations);
    
    return newOperation;
  }
  
  // Eliminar una operación pendiente
  static removePendingOperation(operationId) {
    const pendingOperations = this.loadPendingOperations();
    const filteredOperations = pendingOperations.filter(op => op.id !== operationId);
    this.savePendingOperations(filteredOperations);
  }
  
  // Sincronizar operaciones pendientes con Firebase
  static async syncPendingOperations() {
    // Verificar si hay conexión a internet
    if (!navigator.onLine) {
      console.log('No hay conexión a internet, no se puede sincronizar');
      this.updateStatus(this.STATUS.PENDING);
      return false;
    }
    
    // Verificar si Firebase está inicializado
    if (!FirebaseService.isInitialized()) {
      console.log('Firebase no está inicializado, no se puede sincronizar');
      this.updateStatus(this.STATUS.ERROR);
      return false;
    }
    
    // Cargar operaciones pendientes
    const pendingOperations = this.loadPendingOperations();
    
    // Si no hay operaciones pendientes, no hacer nada
    if (pendingOperations.length === 0) {
      this.updateStatus(this.STATUS.SYNCED);
      return true;
    }
    
    // Actualizar estado a sincronizando
    this.updateStatus(this.STATUS.SYNCING);
    
    // Procesar cada operación pendiente
    const successfulOperations = [];
    
    for (const operation of pendingOperations) {
      try {
        let success = false;
        
        switch (operation.type) {
          case this.OPERATION_TYPES.ADD:
            await FirebaseService.addStudent(operation.data);
            success = true;
            break;
            
          case this.OPERATION_TYPES.UPDATE:
            // Buscar si el estudiante existe en Firebase
            const existingStudent = await FirebaseService.getStudentByDocumento(operation.data.Documento);
            if (existingStudent) {
              // Verificar que el estudiante tenga un hexId
              if (!operation.data.hexId) {
                operation.data.hexId = generateHexId();
              }
              
              // Actualizar solo si el hexId coincide
              if (operation.data.hexId === existingStudent.hexId) {
                await FirebaseService.updateStudent(existingStudent.id, operation.data);
                success = true;
              } else {
                console.error('Error: hexId no coincide, no se actualizará el estudiante', {
                  expected: existingStudent.hexId,
                  received: operation.data.hexId
                });
                success = false;
              }
            } else {
              console.error('Error: No se encontró el estudiante para actualizar', operation.data.Documento);
              success = false;
            }
            break;
            
          case this.OPERATION_TYPES.DELETE:
            // Buscar si el estudiante existe en Firebase
            const studentToDelete = await FirebaseService.getStudentByDocumento(operation.data.Documento);
            if (studentToDelete) {
              await FirebaseService.deleteStudent(studentToDelete.id);
            }
            success = true;
            break;
            
          case this.OPERATION_TYPES.BATCH_UPDATE:
            await FirebaseService.updateMultipleStudents(operation.data);
            success = true;
            break;
            
          case this.OPERATION_TYPES.IMPORT:
            try {
              // Verificar que los datos sean un array válido
              if (!Array.isArray(operation.data)) {
                console.error('Error en operación IMPORT: datos no son un array', operation.data);
                success = false;
                break;
              }
              
              // Verificar que el array no esté vacío
              if (operation.data.length === 0) {
                console.log('Operación IMPORT con array vacío, marcando como completada');
                success = true;
                break;
              }
              
              // Verificar que cada estudiante tenga un Documento válido
              const invalidStudents = operation.data.filter(student => !student.Documento);
              if (invalidStudents.length > 0) {
                console.error('Error en operación IMPORT: hay estudiantes sin Documento', invalidStudents);
                // Continuar con los estudiantes válidos
                operation.data = operation.data.filter(student => student.Documento);
                if (operation.data.length === 0) {
                  console.error('No hay estudiantes válidos para importar');
                  success = false;
                  break;
                }
              }
              
              console.log('Iniciando importación de estudiantes:', {
                total: operation.data.length,
                primerEstudiante: operation.data[0],
                ultimoEstudiante: operation.data[operation.data.length - 1]
              });
              
              // Procesar en lotes más pequeños para evitar sobrecargar Firebase
              const batchSize = 10; // Reducir el tamaño del lote para mayor estabilidad
              for (let i = 0; i < operation.data.length; i += batchSize) {
                const batch = operation.data.slice(i, i + batchSize);
                try {
                  await FirebaseService.importStudents(batch);
                  console.log(`Importado lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(operation.data.length/batchSize)}, ${batch.length} estudiantes`);
                } catch (batchError) {
                  console.error(`Error al importar lote ${Math.floor(i/batchSize) + 1}:`, batchError);
                  // Intentar importar uno por uno para identificar cuál está causando problemas
                  for (const student of batch) {
                    try {
                      await FirebaseService.addStudent(student);
                      console.log(`Importado estudiante individual: ${student.Documento}`);
                    } catch (studentError) {
                      console.error(`Error al importar estudiante ${student.Documento}:`, studentError, student);
                    }
                  }
                }
              }
              
              success = true;
            } catch (error) {
              console.error('Error detallado en operación IMPORT:', error);
              // Intentar obtener más información sobre el error
              console.error('Mensaje de error:', error.message);
              console.error('Código de error:', error.code);
              console.error('Stack trace:', error.stack);
              success = false;
            }
            break;
            
          default:
            console.warn('Tipo de operación desconocido:', operation.type);
            success = false;
        }
        
        if (success) {
          successfulOperations.push(operation.id);
        }
      } catch (error) {
        console.error('Error al sincronizar operación:', operation, error);
      }
    }
    
    // Eliminar operaciones sincronizadas exitosamente
    if (successfulOperations.length > 0) {
      const remainingOperations = pendingOperations.filter(op => !successfulOperations.includes(op.id));
      this.savePendingOperations(remainingOperations);
      
      // Actualizar estado según si quedan operaciones pendientes
      if (remainingOperations.length > 0) {
        this.updateStatus(this.STATUS.PENDING);
        return false;
      } else {
        this.updateStatus(this.STATUS.SYNCED);
        return true;
      }
    } else {
      // Si no se sincronizó ninguna operación, mantener estado pendiente
      this.updateStatus(this.STATUS.PENDING);
      return false;
    }
  }
  
  // Verificar si hay operaciones pendientes
  static hasPendingOperations() {
    const pendingOperations = this.loadPendingOperations();
    return pendingOperations.length > 0;
  }
  
  // Obtener número de operaciones pendientes
  static getPendingOperationsCount() {
    try {
      const pendingOperationsJson = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      const pendingOperations = pendingOperationsJson ? JSON.parse(pendingOperationsJson) : [];
      return pendingOperations.length;
    } catch (error) {
      console.error('Error al obtener número de operaciones pendientes:', error);
      return 0;
    }
  }
}

export default SyncService;
