import React, { useState, useEffect, useRef } from 'react';
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
import IntervencionIndividualService from '../../services/IntervencionIndividualService';
import IntervencionIndividualForm from './IntervencionIndividualForm';
import moment from 'moment';

// Configurar moment para usar formato de fecha en español
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
});

const { Title, Text, Paragraph } = Typography;

const IntervencionIndividualDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [intervencion, setIntervencion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    loadIntervencion();
  }, [id]);

  const loadIntervencion = async () => {
    setLoading(true);
    try {
      const data = await IntervencionIndividualService.getIntervencionIndividualById(id);
      if (!data) {
        message.error('No se encontró la intervención especificada');
        navigate('/intervenciones/individuales');
        return;
      }
      setIntervencion(data);
    } catch (error) {
      console.error('Error al cargar intervención:', error);
      message.error('Error al cargar los datos de la intervención');
      navigate('/intervenciones/individuales');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (intervencion?.documentoEstudiante) {
      navigate(`/estudiantes/${intervencion.documentoEstudiante}/intervenciones`);
    } else {
      navigate('/intervenciones/individuales');
    }
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('intervencion-detail');
    const originalContents = document.body.innerHTML;
    
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
          <title>Intervención Individual - ${intervencion.nombreEstudiante || intervencion.documentoEstudiante}</title>
          ${printStyles}
        </head>
        <body>
          <h1>Detalle de Intervención Individual</h1>
          
          <div class="header">
            <div>
              <strong>Fecha:</strong> ${moment(intervencion.fecha).format('DD/MM/YYYY')}
            </div>
            <div>
              <strong>Estudiante:</strong> ${intervencion.nombreEstudiante || intervencion.documentoEstudiante}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Información General</div>
            <table>
              <tr>
                <th>Tipo</th>
                <td><span class="tag">${intervencion.tipo ? intervencion.tipo.charAt(0).toUpperCase() + intervencion.tipo.slice(1) : 'No especificado'}</span></td>
                <th>Estado</th>
                <td><span class="tag">${intervencion.estado ? intervencion.estado.replace('_', ' ').charAt(0).toUpperCase() + intervencion.estado.replace('_', ' ').slice(1) : 'No especificado'}</span></td>
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
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await IntervencionIndividualService.deleteIntervencionIndividual(id);
          message.success('Intervención eliminada correctamente');
          navigate('/intervenciones/individuales');
        } catch (error) {
          console.error('Error al eliminar intervención:', error);
          message.error('Error al eliminar la intervención');
        }
      }
    });
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
  };

  const handleEditModalSubmit = async (values) => {
    try {
      await IntervencionIndividualService.updateIntervencionIndividual(id, values);
      message.success('Intervención actualizada correctamente');
      setIsEditModalVisible(false);
      loadIntervencion();
    } catch (error) {
      console.error('Error al actualizar intervención:', error);
      message.error('Error al actualizar la intervención');
    }
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Cargando información de la intervención...</p>
      </Card>
    );
  }

  return (
    <Card id="intervencion-detail">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            Volver
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Detalles de Intervención Individual
          </Title>
        </Space>

        <Divider />

        <Descriptions
          bordered
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Estudiante">
            {intervencion.nombreEstudiante || intervencion.documentoEstudiante}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha">
            {moment(intervencion.fecha).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Tipo">
            <Tag color={
              intervencion.tipo === 'academica' ? 'blue' : 
              intervencion.tipo === 'conductual' ? 'orange' : 
              intervencion.tipo === 'asistencia' ? 'green' : 
              'default'
            }>
              {intervencion.tipo ? intervencion.tipo.charAt(0).toUpperCase() + intervencion.tipo.slice(1) : 'No especificado'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={
              intervencion.estado === 'pendiente' ? 'orange' : 
              intervencion.estado === 'en_proceso' ? 'blue' : 
              intervencion.estado === 'completada' ? 'green' : 
              intervencion.estado === 'cancelada' ? 'red' : 
              'default'
            }>
              {intervencion.estado ? intervencion.estado.replace('_', ' ').charAt(0).toUpperCase() + intervencion.estado.replace('_', ' ').slice(1) : 'No especificado'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Registrado por" span={2}>
            {intervencion.registradoPor?.nombre || 'Sistema'}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha de registro" span={2}>
            {intervencion.fechaCreacion ? moment(intervencion.fechaCreacion.toDate()).format('DD/MM/YYYY HH:mm') : 'No disponible'}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Descripción</Divider>
        <Paragraph>
          {intervencion.descripcion || 'No hay descripción disponible'}
        </Paragraph>

        <Divider orientation="left">Acuerdos y compromisos</Divider>
        <Paragraph>
          {intervencion.acuerdos || 'No hay acuerdos registrados'}
        </Paragraph>

        <Divider orientation="left">Observaciones adicionales</Divider>
        <Paragraph>
          {intervencion.observaciones || 'No hay observaciones adicionales'}
        </Paragraph>

        <Divider />

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
      </Space>

      <Modal
        title="Editar Intervención Individual"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <IntervencionIndividualForm
          initialValues={intervencion}
          onSubmit={handleEditModalSubmit}
          onCancel={handleEditModalCancel}
          documentoEstudiante={intervencion?.documentoEstudiante}
          useUniqueKeys={true}
        />
      </Modal>
    </Card>
  );
};

export default IntervencionIndividualDetail;
