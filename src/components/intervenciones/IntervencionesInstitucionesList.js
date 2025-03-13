import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Input, 
  Modal, 
  message 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import IntervencionInstitucionService from '../../services/IntervencionInstitucionService';
import IntervencionInstitucionForm from './IntervencionInstitucionForm';
import moment from 'moment';
import 'moment/locale/es';

// Configurar moment para usar formato de fecha en español
moment.locale('es');

const { Title } = Typography;
const { Search } = Input;

const IntervencionesInstitucionesList = () => {
  const [intervenciones, setIntervenciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarIntervenciones();
  }, []);

  useEffect(() => {
    filtrarDatos();
  }, [searchText, intervenciones]);

  const cargarIntervenciones = async () => {
    setLoading(true);
    try {
      const data = await IntervencionInstitucionService.getAllIntervencionesInstituciones();
      setIntervenciones(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error al cargar intervenciones con instituciones:', error);
      message.error('Error al cargar la lista de intervenciones con instituciones');
    } finally {
      setLoading(false);
    }
  };

  const filtrarDatos = () => {
    if (!searchText) {
      setFilteredData(intervenciones);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = intervenciones.filter(item => {
      return (
        (item.nombreEstudiante && item.nombreEstudiante.toLowerCase().includes(searchLower)) ||
        (item.documentoEstudiante && item.documentoEstudiante.toLowerCase().includes(searchLower)) ||
        (item.nombreInstitucion && item.nombreInstitucion.toLowerCase().includes(searchLower)) ||
        (item.tipoInstitucion && item.tipoInstitucion.toLowerCase().includes(searchLower))
      );
    });

    setFilteredData(filtered);
  };

  const handleSearch = value => {
    setSearchText(value);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCreate = async (values) => {
    try {
      await IntervencionInstitucionService.createIntervencionInstitucion(values);
      message.success('Intervención con institución creada exitosamente');
      setIsModalVisible(false);
      cargarIntervenciones();
    } catch (error) {
      console.error('Error al crear intervención con institución:', error);
      message.error('Error al crear la intervención con institución');
    }
  };

  const handleDelete = (id) => {
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
          cargarIntervenciones();
        } catch (error) {
          console.error('Error al eliminar intervención con institución:', error);
          message.error('Error al eliminar la intervención con institución');
        }
      }
    });
  };

  const handleView = (id) => {
    navigate(`/intervenciones/instituciones/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/intervenciones/instituciones/${id}/edit`);
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

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha) => moment(fecha).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.fecha).unix() - moment(b.fecha).unix(),
    },
    {
      title: 'Estudiante',
      dataIndex: 'nombreEstudiante',
      key: 'nombreEstudiante',
      render: (nombre, record) => nombre || record.documentoEstudiante || 'No especificado',
    },
    {
      title: 'Institución',
      dataIndex: 'nombreInstitucion',
      key: 'nombreInstitucion',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoInstitucion',
      key: 'tipoInstitucion',
      render: (tipo) => getTipoInstitucionTag(tipo),
      filters: [
        { text: 'Educativa', value: 'educativa' },
        { text: 'Salud', value: 'salud' },
        { text: 'Social', value: 'social' },
        { text: 'Judicial', value: 'judicial' },
        { text: 'Otra', value: 'otra' },
      ],
      onFilter: (value, record) => record.tipoInstitucion === value,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => getEstadoTag(estado),
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'En proceso', value: 'en_proceso' },
        { text: 'Completada', value: 'completada' },
        { text: 'Cancelada', value: 'cancelada' },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          />
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
          <Button
            type="danger"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Intervenciones con Instituciones</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showModal}
        >
          Nueva Intervención
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Buscar por estudiante, documento o institución"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey={(record, index) => `${record.id}-${index}`}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Nueva Intervención con Institución"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <IntervencionInstitucionForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
};

export default IntervencionesInstitucionesList;
