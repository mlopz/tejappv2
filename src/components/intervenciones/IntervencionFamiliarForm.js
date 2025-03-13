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
  Col,
  Checkbox,
  Card
} from 'antd';
import { SaveOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment';
import DataService from '../../services/DataService';
import FamiliaService from '../../services/FamiliaService';
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

const IntervencionFamiliarForm = ({ 
  initialValues, 
  onSubmit, 
  onCancel, 
  familia,
  familiaId,
  useUniqueKeys = false
}) => {
  const [form] = Form.useForm();
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(familia);
  const [familias, setFamilias] = useState([]);
  const [miembrosFamilia, setMiembrosFamilia] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!familia && !familiaId) {
      loadFamilias();
    } else if (familiaId && !familia) {
      loadFamiliaById(familiaId);
    } else if (familia) {
      setMiembrosFamilia(familia.miembros || []);
    }
    
    if (initialValues) {
      // Convertir fecha a objeto moment para el DatePicker
      const values = {
        ...initialValues,
        fecha: initialValues.fecha ? moment(initialValues.fecha) : null,
        miembrosPresentes: initialValues.miembrosPresentes?.map(m => m.documentoEstudiante) || []
      };
      form.setFieldsValue(values);
    } else {
      form.resetFields();
      form.setFieldsValue({
        fecha: moment(),
        estado: 'pendiente'
      });
      
      // Si tenemos una familia preseleccionada
      if (familiaId) {
        form.setFieldsValue({
          familiaId
        });
      }
    }
  }, [initialValues, form, familia, familiaId]);

  const loadFamilias = async () => {
    setLoading(true);
    try {
      const data = await FamiliaService.loadFamilias(true);
      setFamilias(data);
    } catch (error) {
      console.error('Error al cargar familias:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFamiliaById = async (id) => {
    setLoading(true);
    try {
      const data = await FamiliaService.getFamiliaById(id);
      setFamiliaSeleccionada(data);
      setMiembrosFamilia(data.miembros || []);
    } catch (error) {
      console.error('Error al cargar familia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFamiliaChange = async (value) => {
    try {
      const fam = await FamiliaService.getFamiliaById(value);
      setFamiliaSeleccionada(fam);
      setMiembrosFamilia(fam.miembros || []);
      // Limpiar miembros seleccionados al cambiar de familia
      form.setFieldsValue({
        miembrosPresentes: []
      });
    } catch (error) {
      console.error('Error al cargar detalles de la familia:', error);
    }
  };

  const handleSubmit = (values) => {
    // Convertir fecha a formato ISO
    const formattedValues = {
      ...values,
      fecha: values.fecha ? values.fecha.toISOString() : new Date().toISOString()
    };
    
    // Convertir los IDs de miembros presentes a objetos completos
    if (values.miembrosPresentes && values.miembrosPresentes.length > 0) {
      formattedValues.miembrosPresentes = values.miembrosPresentes.map(docEstudiante => {
        const miembro = miembrosFamilia.find(m => m.documentoEstudiante === docEstudiante);
        return miembro || { documentoEstudiante: docEstudiante };
      });
    } else {
      formattedValues.miembrosPresentes = [];
    }
    
    onSubmit(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        estado: 'pendiente',
        fecha: moment(),
        miembrosPresentes: []
      }}
    >
      {!familiaId && (
        <Form.Item
          name="familiaId"
          label="Familia"
          rules={[{ required: true, message: 'Por favor seleccione una familia' }]}
        >
          <Select
            showSearch
            placeholder="Seleccione una familia"
            optionFilterProp="children"
            onChange={handleFamiliaChange}
            loading={loading}
            disabled={!!familiaId}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {familias.map(fam => (
              <Option key={fam.id} value={fam.id}>
                {fam.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {(familiaSeleccionada || familia) && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Familia: </Text>
          <Text>
            {familia 
              ? familia.nombre
              : familiaSeleccionada.nombre
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
              <Option value="seguimiento">Seguimiento</Option>
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

      {(miembrosFamilia && miembrosFamilia.length > 0) && (
        <Form.Item
          name="miembrosPresentes"
          label="Miembros presentes en la intervención"
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Card size="small" title="Seleccione los miembros presentes">
              <Row>
                {miembrosFamilia.map((miembro, index) => (
                  <Col span={24} key={generateUniqueKeyForItem(miembro, index, 'miembro-familia')} style={{ marginBottom: 8 }}>
                    <Checkbox value={miembro.documentoEstudiante}>
                      <Space>
                        <UserOutlined />
                        {miembro.nombreCompleto} ({miembro.relacion})
                      </Space>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Card>
          </Checkbox.Group>
        </Form.Item>
      )}

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

export default IntervencionFamiliarForm;
