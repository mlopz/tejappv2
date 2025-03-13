import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tooltip, 
  Tag, 
  Modal, 
  message, 
  Typography,
  Input,
  DatePicker,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  SearchOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import IntervencionIndividualService from '../../services/IntervencionIndividualService';
import IntervencionIndividualForm from './IntervencionIndividualForm';
import { useNavigate, useParams } from 'react-router-dom';
import DataService from '../../services/DataService';
import moment from 'moment';
import { generateUniqueKeyForItem } from '../../utils/uniqueKeyGenerator';

// Configurar moment para usar formato de fecha en español
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
});

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const IntervencionesIndividualesList = () => {
  const { documentoEstudiante } = useParams();
  const navigate = useNavigate();

  const [intervenciones, setIntervenciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIntervencion, setCurrentIntervencion] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [estudiante, setEstudiante] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    fechaInicio: null,
    fechaFin: null
  });

  useEffect(() => {
    if (documentoEstudiante) {
      loadEstudiante();
    }
    loadIntervenciones();
  }, [documentoEstudiante]);

  const loadEstudiante = async () => {
    try {
      const data = await DataService.getStudentById(documentoEstudiante);
      setEstudiante(data);
    } catch (error) {
      console.error('Error al cargar estudiante:', error);
      message.error('Error al cargar los datos del estudiante');
    }
  };

  const loadIntervenciones = async () => {
    setLoading(true);
    try {
      let data;
      if (documentoEstudiante) {
        data = await IntervencionIndividualService.loadIntervencionesIndividualesByEstudiante(documentoEstudiante);
      } else {
        // Aplicar filtros
        const filtrosAplicados = { ...filtros };
        
        // Convertir fechas si existen
        if (filtros.fechaInicio && filtros.fechaFin) {
          filtrosAplicados.fechaInicio = filtros.fechaInicio.format('YYYY-MM-DD');
          filtrosAplicados.fechaFin = filtros.fechaFin.format('YYYY-MM-DD');
        }
        
        data = await IntervencionIndividualService.loadIntervencionesIndividuales(filtrosAplicados);
      }
      setIntervenciones(data);
    } catch (error) {
      console.error('Error al cargar intervenciones:', error);
      message.error('Error al cargar las intervenciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntervencion = () => {
    setCurrentIntervencion(null);
    setModalTitle('Añadir Nueva Intervención Individual');
    setIsModalVisible(true);
  };

  const handleEditIntervencion = (intervencion) => {
    setCurrentIntervencion(intervencion);
    setModalTitle('Editar Intervención Individual');
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalSubmit = async (values) => {
    try {
      // Añadir documento del estudiante si estamos en la vista de un estudiante específico
      if (documentoEstudiante) {
        values.documentoEstudiante = documentoEstudiante;
      }
      
      // Añadir información del usuario que registra
      const usuario = {
        id: 'usuario_actual', // Esto debería venir de un contexto de autenticación
        nombre: 'Usuario Actual' // Esto debería venir de un contexto de autenticación
      };
      
      values.registradoPor = usuario;
      
      if (currentIntervencion) {
        // Actualizar intervención existente
        await IntervencionIndividualService.updateIntervencionIndividual(currentIntervencion.id, values);
        message.success('Intervención actualizada correctamente');
      } else {
        // Crear nueva intervención
        await IntervencionIndividualService.createIntervencionIndividual(values);
        message.success('Intervención creada correctamente');
      }
      setIsModalVisible(false);
      loadIntervenciones();
    } catch (error) {
      console.error('Error al guardar intervención:', error);
      message.error('Error al guardar la intervención');
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros({
      ...filtros,
      [campo]: valor
    });
  };

  const handleFiltrar = () => {
    loadIntervenciones();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      fechaInicio: null,
      fechaFin: null
    });
    loadIntervenciones();
  };

  const handleFechaChange = (dates) => {
    if (dates) {
      setFiltros({
        ...filtros,
        fechaInicio: dates[0],
        fechaFin: dates[1]
      });
    } else {
      setFiltros({
        ...filtros,
        fechaInicio: null,
        fechaFin: null
      });
    }
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: (record, index) => `fecha-${record.id}-${index}`,
      render: (text) => moment(text).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.fecha) - new Date(b.fecha)
    },
    {
      title: 'Estudiante',
      dataIndex: 'documentoEstudiante',
      key: (record, index) => `estudiante-${record.id}-${index}`,
      render: (text, record) => record.nombreEstudiante || text,
      // Solo mostrar esta columna si no estamos en la vista de un estudiante específico
      hidden: !!documentoEstudiante
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: (record, index) => `tipo-${record.id}-${index}`,
      render: (text) => (
        <Tag color={
          text === 'academica' ? 'blue' : 
          text === 'conductual' ? 'orange' : 
          text === 'asistencia' ? 'green' : 
          'default'
        }>
          {text ? text.charAt(0).toUpperCase() + text.slice(1) : 'No especificado'}
        </Tag>
      ),
      filters: [
        { text: 'Académica', value: 'academica' },
        { text: 'Conductual', value: 'conductual' },
        { text: 'Asistencia', value: 'asistencia' },
        { text: 'Otra', value: 'otra' }
      ],
      onFilter: (value, record) => record.tipo === value
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: (record, index) => `estado-${record.id}-${index}`,
      render: (text) => (
        <Tag color={
          text === 'pendiente' ? 'orange' : 
          text === 'en_proceso' ? 'blue' : 
          text === 'completada' ? 'green' : 
          text === 'cancelada' ? 'red' : 
          'default'
        }>
          {text ? text.replace('_', ' ').charAt(0).toUpperCase() + text.replace('_', ' ').slice(1) : 'No especificado'}
        </Tag>
      ),
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'En proceso', value: 'en_proceso' },
        { text: 'Completada', value: 'completada' },
        { text: 'Cancelada', value: 'cancelada' }
      ],
      onFilter: (value, record) => record.estado === value
    },
    {
      title: 'Registrado por',
      dataIndex: ['registradoPor', 'nombre'],
      key: 'registradoPor',
      render: (text) => text || 'Sistema'
    },
    {
      title: 'Acciones',
      key: (record, index) => `acciones-${record.id}-${index}`,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar intervención">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditIntervencion(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Ver detalles">
            <Button 
              icon={<FileTextOutlined />} 
              onClick={() => navigate(`/intervenciones/individual/${record.id}`)} 
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ].filter(column => !column.hidden);

  return (
    <Card>
      <Title level={3}>
        {estudiante 
          ? `Intervenciones de ${estudiante['Nombre Completo'] || `${estudiante.Nombre} ${estudiante.Apellido}`}`
          : 'Intervenciones Individuales'
        }
      </Title>
      
      {!documentoEstudiante && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Select
                placeholder="Tipo de intervención"
                style={{ width: 200 }}
                value={filtros.tipo || undefined}
                onChange={(value) => handleFiltroChange('tipo', value)}
                allowClear
              >
                <Option value="academica">Académica</Option>
                <Option value="conductual">Conductual</Option>
                <Option value="asistencia">Asistencia</Option>
                <Option value="otra">Otra</Option>
              </Select>
              
              <Select
                placeholder="Estado"
                style={{ width: 200 }}
                value={filtros.estado || undefined}
                onChange={(value) => handleFiltroChange('estado', value)}
                allowClear
              >
                <Option value="pendiente">Pendiente</Option>
                <Option value="en_proceso">En proceso</Option>
                <Option value="completada">Completada</Option>
                <Option value="cancelada">Cancelada</Option>
              </Select>
              
              <RangePicker 
                placeholder={['Fecha inicio', 'Fecha fin']}
                value={filtros.fechaInicio && filtros.fechaFin ? [filtros.fechaInicio, filtros.fechaFin] : null}
                onChange={handleFechaChange}
              />
              
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleFiltrar}
              >
                Filtrar
              </Button>
              
              <Button onClick={handleLimpiarFiltros}>
                Limpiar filtros
              </Button>
            </Space>
          </Space>
        </Card>
      )}
      
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddIntervencion}
        >
          Añadir Intervención
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={intervenciones}
        rowKey={(record, index) => generateUniqueKeyForItem(record, index, 'intervencion')}
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <p style={{ margin: 0 }}>
              <strong>Descripción:</strong> {record.descripcion}
            </p>
          )
        }}
      />
      
      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose
        width={700}
      >
        <IntervencionIndividualForm
          initialValues={currentIntervencion}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
          estudiante={estudiante}
          documentoEstudiante={documentoEstudiante}
          useUniqueKeys={true}
        />
      </Modal>
    </Card>
  );
};

export default IntervencionesIndividualesList;
