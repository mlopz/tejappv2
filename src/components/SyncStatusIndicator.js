import React, { useState, useEffect } from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import SyncService from '../services/SyncService';

const SyncStatusIndicator = () => {
  const [syncStatus, setSyncStatus] = useState(SyncService.getStatus());
  const [pendingCount, setPendingCount] = useState(SyncService.getPendingOperationsCount());
  
  useEffect(() => {
    // Registrar callback para cambios de estado
    const handleStatusChange = (status) => {
      setSyncStatus(status);
      setPendingCount(SyncService.getPendingOperationsCount());
    };
    
    SyncService.registerStatusChangeCallback(handleStatusChange);
    
    // Limpiar al desmontar
    return () => {
      SyncService.unregisterStatusChangeCallback(handleStatusChange);
    };
  }, []);
  
  // Forzar sincronización manual
  const handleSync = () => {
    if (syncStatus === SyncService.STATUS.PENDING) {
      SyncService.syncPendingOperations();
    }
  };
  
  // Determinar color y texto según estado
  let badgeVariant = 'secondary';
  let statusText = 'Desconectado';
  let icon = '⚪';
  
  switch (syncStatus) {
    case SyncService.STATUS.SYNCED:
      badgeVariant = 'success';
      statusText = 'Sincronizado';
      icon = '✓';
      break;
    case SyncService.STATUS.PENDING:
      badgeVariant = 'warning';
      statusText = `Pendiente (${pendingCount})`;
      icon = '⚠️';
      break;
    case SyncService.STATUS.SYNCING:
      badgeVariant = 'info';
      statusText = 'Sincronizando...';
      icon = '🔄';
      break;
    case SyncService.STATUS.ERROR:
      badgeVariant = 'danger';
      statusText = 'Error';
      icon = '❌';
      break;
    default:
      break;
  }
  
  // Tooltip con información detallada
  const renderTooltip = (props) => (
    <Tooltip id="sync-status-tooltip" {...props}>
      <strong>{statusText}</strong>
      {syncStatus === SyncService.STATUS.PENDING && (
        <div>
          Hay {pendingCount} operaciones pendientes de sincronización.
          <br />
          <span className="text-white">Haz clic para sincronizar ahora</span>
        </div>
      )}
      {syncStatus === SyncService.STATUS.ERROR && (
        <div>
          Error al sincronizar con Firebase.
          <br />
          <span className="text-white">Haz clic para reintentar</span>
        </div>
      )}
      {syncStatus === SyncService.STATUS.SYNCED && (
        <div>Todos los datos están sincronizados con Firebase.</div>
      )}
      {syncStatus === SyncService.STATUS.SYNCING && (
        <div>Sincronizando datos con Firebase...</div>
      )}
    </Tooltip>
  );
  
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >
      <Badge 
        bg={badgeVariant} 
        className="mx-2 d-flex align-items-center" 
        style={{ cursor: syncStatus === SyncService.STATUS.PENDING || syncStatus === SyncService.STATUS.ERROR ? 'pointer' : 'default' }}
        onClick={handleSync}
      >
        <span className="me-1">{icon}</span>
        <span>{statusText}</span>
      </Badge>
    </OverlayTrigger>
  );
};

export default SyncStatusIndicator;
