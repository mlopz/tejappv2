import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Divider, 
  Modal, 
  message,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined, 
  DeleteOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import IntervencionInstitucionService from '../../services/IntervencionInstitucionService';
import IntervencionInstitucionForm from './IntervencionInstitucionForm';
import moment from 'moment';
import 'moment/locale/es';

// Configurar moment para usar formato de fecha en español
moment.locale('es');

const { Title } = Typography;

const IntervencionInstitucionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intervencion, setIntervencion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    cargarIntervencion();
  }, [id]);

  const cargarIntervencion = async () => {
    setLoading(true);
    try {
      const data = await IntervencionInstitucionService.getIntervencionInstitucionById(id);
      if (data) {
        setIntervencion(data);
      } else {
        message.error('No se encontró la intervención con institución');
        navigate('/intervenciones/instituciones');
      }
    } catch (error) {
      console.error('Error al cargar la intervención con institución:', error);
      message.error('Error al cargar los detalles de la intervención con institución');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/intervenciones/instituciones');
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handlePrint = () => {
    // Crear estilos para la impresión
    const printStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 5px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .tag {
          background-color: #f0f0f0;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
        }
        @media print {
          button {
            display: none !important;
          }
        }
      </style>
    `;
    
    // Crear contenido para imprimir
    const printableContent = `
      <html>
        <head>
          <title>Intervención con Institución - ${intervencion.nombreInstitucion}</title>
          ${printStyles}
        </head>
        <body>
          <h1>Detalle de Intervención con Institución</h1>
          
          <div class="header">
            <div>
              <strong>Fecha:</strong> ${moment(intervencion.fecha).format('DD/MM/YYYY')}
            </div>
            <div>
              <strong>Institución:</strong> ${intervencion.nombreInstitucion}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Información General</div>
            <table>
              <tr>
                <th>Estudiante</th>
                <td>${intervencion.nombreEstudiante || intervencion.documentoEstudiante || 'No especificado'}</td>
                <th>Tipo de Institución</th>
                <td><span class="tag">${intervencion.tipoInstitucion ? intervencion.tipoInstitucion.charAt(0).toUpperCase() + intervencion.tipoInstitucion.slice(1) : 'No especificado'}</span></td>
              </tr>
              <tr>
                <th>Estado</th>
                <td><span class="tag">${intervencion.estado ? intervencion.estado.replace('_', ' ').charAt(0).toUpperCase() + intervencion.estado.replace('_', ' ').slice(1) : 'No especificado'}</span></td>
                <th>Contacto</th>
                <td>${intervencion.contactoInstitucion || 'No especificado'}</td>
              </tr>
              <tr>
                <th>Registrado por</th>
                <td>${intervencion.registradoPor?.nombre || 'Sistema'}</td>
                <th>Fecha de registro</th>
                <td>${intervencion.fechaCreacion ? moment(intervencion.fechaCreacion.toDate()).format('DD/MM/YYYY HH:mm') : 'No disponible'}</td>
              </tr>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Descripción</div>
            <p>${intervencion.descripcion || 'No hay descripción disponible'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Acuerdos y compromisos</div>
            <p>${intervencion.acuerdos || 'No hay acuerdos registrados'}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Observaciones adicionales</div>
            <p>${intervencion.observaciones || 'No hay observaciones adicionales'}</p>
          </div>
          
          <div class="section" style="margin-top: 50px; text-align: center;">
            <p>______________________________</p>
            <p>Firma del responsable</p>
          </div>
        </body>
      </html>
    `;
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printableContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Imprimir después de que los recursos se hayan cargado
    printWindow.onload = function() {
      printWindow.print();
      // printWindow.close();
    };
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta intervención?',
      content: 'Esta acción no se puede deshacer',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await IntervencionInstitucionService.deleteIntervencionInstitucion(id);
          message.success('Intervención con institución eliminada exitosamente');
          navigate('/intervenciones/instituciones');
        } catch (error) {
          console.error('Error al eliminar intervención con institución:', error);
          message.error('Error al eliminar la intervención con institución');
        }
      }
    });
  };

  const handleUpdate = async (values) => {
    try {
      await IntervencionInstitucionService.updateIntervencionInstitucion(id, values);
      message.success('Intervención con institución actualizada exitosamente');
      setIsEditModalVisible(false);
      cargarIntervencion();
    } catch (error) {
      console.error('Error al actualizar intervención con institución:', error);
      message.error('Error al actualizar la intervención con institución');
    }
  };

  const getEstadoTag = (estado) => {
    let color = 'default';
    let text = 'Desconocido';

    switch (estado) {
      case 'pendiente':
        color = 'warning';
        text = 'Pendiente';
        break;
      case 'en_proceso':
        color = 'processing';
        text = 'En proceso';
        break;
      case 'completada':
        color = 'success';
        text = 'Completada';
        break;
      case 'cancelada':
        color = 'error';
        text = 'Cancelada';
        break;
      default:
        break;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  const getTipoInstitucionTag = (tipo) => {
    let color = 'default';
    let text = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Desconocido';

    switch (tipo) {
      case 'educativa':
        color = 'blue';
        break;
      case 'salud':
        color = 'green';
        break;
      case 'social':
        color = 'purple';
        break;
      case 'judicial':
        color = 'orange';
        break;
      case 'otra':
        color = 'cyan';
        break;
      default:
        break;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        style={{ marginBottom: 16 }}
      >
        Volver a la lista
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2}>Detalle de Intervención con Institución</Title>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              Editar
            </Button>
            <Button 
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Fecha">
            {moment(intervencion.fecha).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Estudiante">
            {intervencion.nombreEstudiante || intervencion.documentoEstudiante || 'No especificado'}
          </Descriptions.Item>
          <Descriptions.Item label="Institución">
            {intervencion.nombreInstitucion}
          </Descriptions.Item>
          <Descriptions.Item label="Tipo de Institución">
            {getTipoInstitucionTag(intervencion.tipoInstitucion)}
          </Descriptions.Item>
          <Descriptions.Item label="Contacto en la Institución">
            {intervencion.contactoInstitucion || 'No especificado'}
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            {getEstadoTag(intervencion.estado)}
          </Descriptions.Item>
          <Descriptions.Item label="Requiere seguimiento" span={2}>
            {intervencion.seguimiento ? 'Sí' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Descripción" span={2}>
            {intervencion.descripcion || 'No hay descripción disponible'}
          </Descriptions.Item>
          <Descriptions.Item label="Acuerdos y compromisos" span={2}>
            {intervencion.acuerdos || 'No hay acuerdos registrados'}
          </Descriptions.Item>
          <Descriptions.Item label="Observaciones adicionales" span={2}>
            {intervencion.observaciones || 'No hay observaciones adicionales'}
          </Descriptions.Item>
          <Descriptions.Item label="Registrado por">
            {intervencion.registradoPor?.nombre || 'Sistema'}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha de registro">
            {intervencion.fechaCreacion ? moment(intervencion.fechaCreacion.toDate()).format('DD/MM/YYYY HH:mm') : 'No disponible'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="Editar Intervención con Institución"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <IntervencionInstitucionForm
          initialValues={intervencion}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default IntervencionInstitucionDetail;
