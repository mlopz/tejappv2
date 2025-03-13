import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Tooltip, 
  Tag, 
  Modal, 
  message,
  Typography,
  Card
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons';
import FamiliaService from '../../services/FamiliaService';
import FamiliaForm from './FamiliaForm';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const FamiliasList = () => {
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentFamilia, setCurrentFamilia] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadFamilias();
  }, []);

  const loadFamilias = async () => {
    setLoading(true);
    try {
      const data = await FamiliaService.loadFamilias({
        nombre: searchText
      });
      setFamilias(data);
    } catch (error) {
      console.error('Error al cargar familias:', error);
      message.error('Error al cargar las familias');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadFamilias();
  };

  const handleAddFamilia = () => {
    setCurrentFamilia(null);
    setModalTitle('Añadir Nueva Familia');
    setIsModalVisible(true);
  };

  const handleEditFamilia = (familia) => {
    setCurrentFamilia(familia);
    setModalTitle('Editar Familia');
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalSubmit = async (values) => {
    try {
      if (currentFamilia) {
        // Actualizar familia existente
        await FamiliaService.updateFamilia(currentFamilia.id, values);
        message.success('Familia actualizada correctamente');
      } else {
        // Crear nueva familia
        await FamiliaService.createFamilia(values);
        message.success('Familia creada correctamente');
      }
      setIsModalVisible(false);
      loadFamilias();
    } catch (error) {
      console.error('Error al guardar familia:', error);
      message.error('Error al guardar la familia');
    }
  };

  const handleViewIntervenciones = (familia) => {
    navigate(`/familias/${familia.id}/intervenciones`);
  };

  const handleManageMiembros = (familia) => {
    navigate(`/familias/${familia.id}/miembros`);
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (text, record) => (
        <span>
          {text}
          {record.miembros && record.miembros.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {record.miembros.length} miembros
            </Tag>
          )}
        </span>
      )
    },
    {
      title: 'Miembros',
      dataIndex: 'miembros',
      key: 'miembros',
      render: (miembros) => {
        if (!miembros || miembros.length === 0) {
          return <span style={{ color: '#999' }}>Sin miembros</span>;
        }
        
        // Mostrar hasta 3 miembros y luego "y X más"
        const maxToShow = 3;
        const visibleMiembros = miembros.slice(0, maxToShow);
        const remaining = miembros.length - maxToShow;
        
        return (
          <div>
            {visibleMiembros.map((miembro, index) => (
              <div key={`${miembro.documentoEstudiante}-${index}`}>
                <UserOutlined /> {miembro.nombreCompleto || miembro.documentoEstudiante}
                {miembro.relacion && <span> ({miembro.relacion})</span>}
              </div>
            ))}
            {remaining > 0 && (
              <div style={{ color: '#1890ff' }}>
                y {remaining} más...
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo !== false ? 'green' : 'red'}>
          {activo !== false ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false }
      ],
      onFilter: (value, record) => record.activo === value
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar familia">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditFamilia(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Gestionar miembros">
            <Button 
              icon={<TeamOutlined />} 
              onClick={() => handleManageMiembros(record)} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Ver intervenciones">
            <Button 
              icon={<MessageOutlined />} 
              onClick={() => handleViewIntervenciones(record)} 
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Title level={3}>Gestión de Familias</Title>
      
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar por nombre"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={handleSearch}
        >
          Buscar
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddFamilia}
        >
          Añadir Familia
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={familias}
        rowKey={(record, index) => `${record.id}-${index}`}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      
      <Modal
        title={modalTitle}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnClose
      >
        <FamiliaForm
          initialValues={currentFamilia}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
        />
      </Modal>
    </Card>
  );
};

export default FamiliasList;
