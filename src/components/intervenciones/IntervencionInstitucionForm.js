import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  Select, 
  Space, 
  Divider, 
  Typography,
  message,
  Switch
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import DataService from '../../services/DataService';

// Configurar moment para usar formato de fecha en español
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
});

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const IntervencionInstitucionForm = ({ initialValues, onSubmit, onCancel, documentoEstudiante }) => {
  const [form] = Form.useForm();
  const [estudiantes, setEstudiantes] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);

  useEffect(() => {
    if (initialValues) {
      // Convertir la fecha a objeto moment para el DatePicker
      const formattedValues = {
        ...initialValues,
        fecha: initialValues.fecha ? moment(initialValues.fecha) : null
      };
      form.setFieldsValue(formattedValues);
    } else {
      form.resetFields();
      // Si se proporciona un documento de estudiante, establecerlo como valor predeterminado
      if (documentoEstudiante) {
        form.setFieldsValue({ documentoEstudiante });
      }
    }
  }, [initialValues, form, documentoEstudiante]);

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoadingEstudiantes(true);
    try {
      const data = await DataService.loadData();
      // Filtrar solo estudiantes activos
      const estudiantesActivos = data.filter(est => est.Activo !== "No");
      setEstudiantes(estudiantesActivos);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      message.error("Error al cargar la lista de estudiantes");
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  const handleSubmit = (values) => {
    // Convertir fecha a string ISO para almacenamiento
    const formattedValues = {
      ...values,
      fecha: values.fecha ? values.fecha.toISOString() : null
    };

    // Agregar información del estudiante si está disponible
    if (values.documentoEstudiante) {
      const estudiante = estudiantes.find(e => e.Documento === values.documentoEstudiante);
      if (estudiante) {
        formattedValues.nombreEstudiante = `${estudiante.Nombre} ${estudiante.Apellido}`;
      }
    }

    onSubmit(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        fecha: moment(),
        estado: 'pendiente'
      }}
    >
      <Form.Item
        name="fecha"
        label="Fecha"
        rules={[{ required: true, message: 'Por favor seleccione la fecha' }]}
      >
        <DatePicker 
          style={{ width: '100%' }} 
          format="DD/MM/YYYY"
          placeholder="Seleccione fecha"
        />
      </Form.Item>

      <Form.Item
        name="documentoEstudiante"
        label="Estudiante"
        rules={[{ required: true, message: 'Por favor seleccione un estudiante' }]}
      >
        <Select
          showSearch
          placeholder="Seleccione un estudiante"
          optionFilterProp="children"
          loading={loadingEstudiantes}
          disabled={!!documentoEstudiante}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {estudiantes.map((estudiante, index) => (
            <Option key={`${estudiante.Documento}-${index}`} value={estudiante.Documento}>
              {estudiante['Nombre Completo'] || `${estudiante.Nombre} ${estudiante.Apellido}`} - {estudiante.Documento}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="tipoInstitucion"
        label="Tipo de Institución"
        rules={[{ required: true, message: 'Por favor seleccione el tipo de institución' }]}
      >
        <Select placeholder="Seleccione el tipo de institución">
          <Option value="educativa">Educativa</Option>
          <Option value="salud">Salud</Option>
          <Option value="social">Social</Option>
          <Option value="judicial">Judicial</Option>
          <Option value="otra">Otra</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="nombreInstitucion"
        label="Nombre de la Institución"
        rules={[{ required: true, message: 'Por favor ingrese el nombre de la institución' }]}
      >
        <Input placeholder="Ej: Escuela N° 123" />
      </Form.Item>

      <Form.Item
        name="contactoInstitucion"
        label="Contacto en la Institución"
      >
        <Input placeholder="Ej: Juan Pérez - Director" />
      </Form.Item>

      <Form.Item
        name="descripcion"
        label="Descripción"
        rules={[{ required: true, message: 'Por favor ingrese una descripción' }]}
      >
        <TextArea
          placeholder="Describa el motivo y detalles de la intervención"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="acuerdos"
        label="Acuerdos y compromisos"
      >
        <TextArea
          placeholder="Detalle los acuerdos alcanzados con la institución"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="observaciones"
        label="Observaciones adicionales"
      >
        <TextArea
          placeholder="Información adicional relevante"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="estado"
        label="Estado"
        rules={[{ required: true, message: 'Por favor seleccione el estado' }]}
      >
        <Select placeholder="Seleccione el estado">
          <Option value="pendiente">Pendiente</Option>
          <Option value="en_proceso">En proceso</Option>
          <Option value="completada">Completada</Option>
          <Option value="cancelada">Cancelada</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="seguimiento"
        label="Requiere seguimiento"
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

export default IntervencionInstitucionForm;
