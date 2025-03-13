import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Switch, Space, Typography, Select, Divider, Tag } from 'antd';
import { SaveOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons';
import DataService from '../../services/DataService';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

const FamiliaForm = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      // Usar FirebaseService directamente para obtener los estudiantes
      const estudiantesData = await DataService.loadCSVData();
      console.log("Estudiantes cargados:", estudiantesData);
      
      // Filtrar solo estudiantes activos
      const estudiantesActivos = estudiantesData.filter(est => est.Activo !== "No");
      setEstudiantes(estudiantesActivos);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (values) => {
    // Transformar los miembros seleccionados al formato requerido
    if (values.miembrosSeleccionados && values.miembrosSeleccionados.length > 0) {
      const miembros = values.miembrosSeleccionados.map(documentoEstudiante => {
        const estudiante = estudiantes.find(est => est.Documento === documentoEstudiante);
        console.log('Estudiante encontrado para miembro:', estudiante);
        
        return {
          documentoEstudiante,
          nombreCompleto: estudiante 
            ? `${estudiante.Nombre || ''} ${estudiante.Apellido || ''}`.trim() 
            : documentoEstudiante,
          relacion: 'Miembro de familia'
        };
      });
      
      console.log('Miembros procesados para la familia:', miembros);
      values.miembros = miembros;
    }
    
    // Asegurarse de que siempre haya un array de miembros, incluso si está vacío
    if (!values.miembros) {
      values.miembros = [];
    }
    
    // Eliminar el campo temporal de miembrosSeleccionados
    delete values.miembrosSeleccionados;
    
    console.log('Enviando datos de familia:', values);
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ activo: true }}
    >
      <Form.Item
        name="nombre"
        label="Nombre de la familia"
        rules={[{ required: true, message: 'Por favor ingrese el nombre de la familia' }]}
      >
        <Input placeholder="Ej: Familia Pérez" />
      </Form.Item>

      <Form.Item
        name="direccion"
        label="Dirección"
      >
        <Input placeholder="Ej: Calle 123, Ciudad" />
      </Form.Item>

      <Form.Item
        name="telefono"
        label="Teléfono de contacto"
      >
        <Input placeholder="Ej: 555-123-4567" />
      </Form.Item>

      <Form.Item
        name="correo"
        label="Correo electrónico"
        rules={[
          { type: 'email', message: 'Por favor ingrese un correo electrónico válido' }
        ]}
      >
        <Input placeholder="Ej: familia@ejemplo.com" />
      </Form.Item>

      <Divider orientation="left">Miembros de la familia</Divider>
      
      <Form.Item
        name="miembrosSeleccionados"
        label="Seleccionar estudiantes"
        help="Seleccione los estudiantes que pertenecen a esta familia"
      >
        <Select
          mode="multiple"
          placeholder="Seleccione estudiantes"
          loading={loading}
          optionFilterProp="children"
          style={{ width: '100%' }}
          tagRender={props => (
            <Tag closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
              {props.label}
            </Tag>
          )}
        >
          {estudiantes.map((estudiante, index) => (
            <Option 
              key={`${estudiante.Documento}-${index}`} 
              value={estudiante.Documento}
            >
              {estudiante['Nombre Completo'] || `${estudiante.Nombre} ${estudiante.Apellido}`} - {estudiante.Documento}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="observaciones"
        label="Observaciones"
      >
        <TextArea
          placeholder="Información adicional sobre la familia"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="activo"
        label="Activo"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
          >
            Guardar
          </Button>
          <Button
            onClick={onCancel}
            icon={<CloseOutlined />}
          >
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FamiliaForm;
