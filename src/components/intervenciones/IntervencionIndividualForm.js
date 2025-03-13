import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  DatePicker,
  Typography,
  Divider,
  Row,
  Col
} from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import DataService from '../../services/DataService';
import { generateUniqueKeyForItem } from '../../utils/uniqueKeyGenerator';

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
const { Title, Text } = Typography;

const IntervencionIndividualForm = ({ 
  initialValues, 
  onSubmit, 
  onCancel, 
  estudiante,
  documentoEstudiante,
  useUniqueKeys = false
}) => {
  const [form] = Form.useForm();
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(estudiante);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!estudiante && !documentoEstudiante) {
      loadEstudiantes();
    }
    
    if (initialValues) {
      // Convertir fecha a objeto moment para el DatePicker
      const values = {
        ...initialValues,
        fecha: initialValues.fecha ? moment(initialValues.fecha) : moment(),
        // Asegurar que todos los campos de texto tengan valores por defecto
        descripcion: initialValues.descripcion || '',
        acuerdos: initialValues.acuerdos || '',
        observaciones: initialValues.observaciones || '',
        estado: initialValues.estado || 'pendiente',
        tipo: initialValues.tipo || ''
      };
      form.setFieldsValue(values);
    } else {
      form.resetFields();
      form.setFieldsValue({
        fecha: moment(),
        estado: 'pendiente',
        descripcion: '',
        acuerdos: '',
        observaciones: ''
      });
      
      // Si tenemos un estudiante preseleccionado
      if (documentoEstudiante) {
        form.setFieldsValue({
          documentoEstudiante
        });
      }
    }
  }, [initialValues, form, estudiante, documentoEstudiante]);

  const loadEstudiantes = async () => {
    setLoading(true);
    try {
      const data = await DataService.loadCSVData(true);
      setEstudiantes(data);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstudianteChange = (value) => {
    const est = estudiantes.find(e => e.Documento === value);
    setEstudianteSeleccionado(est);
  };

  const handleSubmit = (values) => {
    // Convertir fecha a formato ISO
    const formattedValues = {
      ...values,
      fecha: values.fecha ? values.fecha.toISOString() : new Date().toISOString()
    };
    
    onSubmit(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        estado: 'pendiente',
        fecha: moment()
      }}
    >
      {!documentoEstudiante && (
        <Form.Item
          name="documentoEstudiante"
          label="Estudiante"
          rules={[{ required: true, message: 'Por favor seleccione un estudiante' }]}
        >
          <Select
            showSearch
            placeholder="Seleccione un estudiante"
            optionFilterProp="children"
            onChange={handleEstudianteChange}
            loading={loading}
            disabled={!!documentoEstudiante}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {estudiantes.map((est, index) => (
              <Option 
                key={generateUniqueKeyForItem(est, index, 'estudiante')}
                value={est.Documento}
              >
                {est['Nombre Completo'] || `${est.Nombre} ${est.Apellido}`} - {est.Documento}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {(estudianteSeleccionado || estudiante) && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Estudiante: </Text>
          <Text>
            {estudiante 
              ? estudiante['Nombre Completo'] || `${estudiante.Nombre} ${estudiante.Apellido}`
              : estudianteSeleccionado['Nombre Completo'] || `${estudianteSeleccionado.Nombre} ${estudianteSeleccionado.Apellido}`
            }
          </Text>
        </div>
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="fecha"
            label="Fecha de la intervención"
            rules={[{ required: true, message: 'Por favor seleccione una fecha' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              placeholder="Seleccione fecha"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="tipo"
            label="Tipo de intervención"
            rules={[{ required: true, message: 'Por favor seleccione un tipo' }]}
          >
            <Select placeholder="Seleccione tipo">
              <Option value="academica">Académica</Option>
              <Option value="conductual">Conductual</Option>
              <Option value="asistencia">Asistencia</Option>
              <Option value="otra">Otra</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="descripcion"
        label="Descripción de la intervención"
        rules={[{ required: true, message: 'Por favor ingrese una descripción' }]}
      >
        <TextArea
          placeholder="Describa la intervención realizada"
          autoSize={{ minRows: 4, maxRows: 8 }}
        />
      </Form.Item>

      <Form.Item
        name="acuerdos"
        label="Acuerdos y compromisos"
      >
        <TextArea
          placeholder="Describa los acuerdos alcanzados"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="estado"
        label="Estado"
        rules={[{ required: true, message: 'Por favor seleccione un estado' }]}
      >
        <Select placeholder="Seleccione estado">
          <Option value="pendiente">Pendiente</Option>
          <Option value="en_proceso">En proceso</Option>
          <Option value="completada">Completada</Option>
          <Option value="cancelada">Cancelada</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="observaciones"
        label="Observaciones adicionales"
      >
        <TextArea
          placeholder="Observaciones adicionales"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Divider />

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

export default IntervencionIndividualForm;
