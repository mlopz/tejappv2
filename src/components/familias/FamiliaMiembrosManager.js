import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tooltip, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography,
  Divider,
  Spin
} from 'antd';
import { 
  UserAddOutlined, 
  UserDeleteOutlined, 
  ArrowLeftOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import FamiliaService from '../../services/FamiliaService';
import DataService from '../../services/DataService';

const { Title, Text } = Typography;
const { Option } = Select;

const FamiliaMiembrosManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [familia, setFamilia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesLoading, setEstudiantesLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [form] = Form.useForm();

  // Cargar datos de la familia
  useEffect(() => {
    loadFamilia();
    loadEstudiantes();
  }, [id]);

  const loadFamilia = async () => {
    setLoading(true);
    try {
      const data = await FamiliaService.getFamiliaById(id);
      if (!data) {
        message.error('No se encontró la familia especificada');
        navigate('/familias');
        return;
      }
      setFamilia(data);
    } catch (error) {
      console.error('Error al cargar familia:', error);
      message.error('Error al cargar los datos de la familia');
      navigate('/familias');
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async () => {
    setEstudiantesLoading(true);
    try {
      const data = await DataService.loadCSVData(true);
      console.log("Estudiantes cargados para asignar a familia:", data);
      
      // Filtrar solo estudiantes activos
      const estudiantesActivos = data.filter(est => est.Activo !== "No");
      console.log("Estudiantes activos disponibles:", estudiantesActivos.length);
      
      setEstudiantes(estudiantesActivos);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      message.error('Error al cargar la lista de estudiantes');
    } finally {
      setEstudiantesLoading(false);
    }
  };

  const handleShowAddMiembroModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedEstudiante(null);
  };

  const handleEstudianteSearch = (value) => {
    setSearchText(value);
  };

  const handleEstudianteSelect = (value) => {
    const estudiante = estudiantes.find(e => e.Documento === value);
    setSelectedEstudiante(estudiante);
  };

  const handleAddMiembro = async (values) => {
    if (!selectedEstudiante) {
      message.error('Por favor seleccione un estudiante');
      return;
    }

    try {
      // Agregar la relación al objeto estudiante para que se guarde correctamente
      const estudianteConRelacion = {
        ...selectedEstudiante,
        relacion: values.relacion
      };
      
      await FamiliaService.asociarEstudianteAFamilia(
        id, 
        estudianteConRelacion
      );
      
      message.success('Estudiante asociado correctamente a la familia');
      setIsModalVisible(false);
      loadFamilia();
    } catch (error) {
      console.error('Error al asociar estudiante a familia:', error);
      message.error('Error al asociar el estudiante a la familia');
    }
  };

  const handleRemoveMiembro = async (documentoEstudiante) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este miembro de la familia?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await FamiliaService.desasociarEstudianteDeFamilia(id, documentoEstudiante);
          message.success('Miembro eliminado correctamente de la familia');
          loadFamilia();
        } catch (error) {
          console.error('Error al eliminar miembro de la familia:', error);
          message.error('Error al eliminar el miembro de la familia');
        }
      }
    });
  };

  const handleBack = () => {
    navigate('/familias');
  };

  // Filtrar estudiantes que ya son miembros de la familia
  const getEstudiantesDisponibles = () => {
    if (!familia || !familia.miembros) return estudiantes;
    
    const miembrosDocumentos = familia.miembros.map(m => m.documentoEstudiante);
    return estudiantes.filter(e => !miembrosDocumentos.includes(e.Documento));
  };

  const columns = [
    {
      title: 'Documento',
      dataIndex: 'documentoEstudiante',
      key: 'documentoEstudiante',
    },
    {
      title: 'Nombre',
      dataIndex: 'nombreCompleto',
      key: 'nombreCompleto',
    },
    {
      title: 'Relación',
      dataIndex: 'relacion',
      key: 'relacion',
      render: (text) => text || 'No especificada'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Eliminar de la familia">
            <Button
              danger
              icon={<UserDeleteOutlined />}
              onClick={() => handleRemoveMiembro(record.documentoEstudiante)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Cargando información de la familia...</p>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            Volver
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Gestión de Miembros: {familia?.nombre}
          </Title>
        </Space>

        <Divider />

        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleShowAddMiembroModal}
          >
            Añadir Miembro
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={familia?.miembros || []}
          rowKey={(record, index) => `${record.documentoEstudiante}-${index}`}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No hay miembros en esta familia' }}
        />
      </Space>

      <Modal
        title="Agregar Miembro a la Familia"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMiembro}
        >
          <Form.Item
            name="estudiante"
            label="Estudiante"
            rules={[{ required: true, message: 'Por favor seleccione un estudiante' }]}
          >
            <Select
              showSearch
              placeholder="Buscar estudiante por nombre o documento"
              optionFilterProp="children"
              onSearch={handleEstudianteSearch}
              onChange={handleEstudianteSelect}
              loading={estudiantesLoading}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={{ width: '100%' }}
            >
              {getEstudiantesDisponibles().map((estudiante, index) => {
                const displayText = estudiante['Nombre Completo'] 
                  ? estudiante['Nombre Completo'] 
                  : estudiante.Nombre && estudiante.Apellido 
                  ? `${estudiante.Nombre} ${estudiante.Apellido}` 
                  : `Estudiante ${estudiante.Documento}`;
                
                return (
                  <Option key={`${estudiante.Documento}-${index}`} value={estudiante.Documento}>
                    {displayText}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="relacion"
            label="Relación con la familia"
            rules={[{ required: true, message: 'Por favor especifique la relación' }]}
          >
            <Select placeholder="Seleccione la relación">
              <Option value="Padre/Madre">Padre/Madre</Option>
              <Option value="Hijo/Hija">Hijo/Hija</Option>
              <Option value="Hermano/Hermana">Hermano/Hermana</Option>
              <Option value="Abuelo/Abuela">Abuelo/Abuela</Option>
              <Option value="Tío/Tía">Tío/Tía</Option>
              <Option value="Primo/Prima">Primo/Prima</Option>
              <Option value="Otro">Otro</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Añadir
              </Button>
              <Button onClick={handleModalCancel}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default FamiliaMiembrosManager;
