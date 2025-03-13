import moment from 'moment';

// Función para generar IDs únicos sin depender de uuid
const generateId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
};

// Función para generar fechas aleatorias en un rango
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Función para formatear fechas en formato YYYY-MM-DD
const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD');
};

// Datos de estudiantes de muestra - usando los mismos campos que en la aplicación
export const sampleStudents = [
  {
    Documento: "12345678",
    "Nombre Completo": "Juan Pérez",
    Nombre: "Juan",
    Apellido: "Pérez",
    Edad: 8,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2015, 0, 1), new Date(2016, 0, 1))),
    Genero: "Masculino",
    Direccion: "Calle 123, Ciudad",
    Telefono: "123-456-7890",
    "Correo Electronico": "juan.perez@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "Sí",
    Grupo: "A",
    Turno: "Mañana",
    "Dias Asistencia": "Lunes,Miércoles,Viernes",
    Activo: true,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": "",
    "Motivo Baja": "",
    familiaId: "familia1",
    documento: "12345678"  // Campo duplicado para compatibilidad
  },
  {
    Documento: "23456789",
    "Nombre Completo": "María García",
    Nombre: "María",
    Apellido: "García",
    Edad: 9,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2014, 0, 1), new Date(2015, 0, 1))),
    Genero: "Femenino",
    Direccion: "Avenida 456, Ciudad",
    Telefono: "234-567-8901",
    "Correo Electronico": "maria.garcia@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "No",
    Grupo: "B",
    Turno: "Tarde",
    "Dias Asistencia": "Martes,Jueves",
    Activo: true,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": "",
    "Motivo Baja": "",
    familiaId: "familia1",
    documento: "23456789"  // Campo duplicado para compatibilidad
  },
  {
    Documento: "34567890",
    "Nombre Completo": "Carlos López",
    Nombre: "Carlos",
    Apellido: "López",
    Edad: 7,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2016, 0, 1), new Date(2017, 0, 1))),
    Genero: "Masculino",
    Direccion: "Plaza 789, Ciudad",
    Telefono: "345-678-9012",
    "Correo Electronico": "carlos.lopez@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "Sí",
    Grupo: "C",
    Turno: "Mañana",
    "Dias Asistencia": "Lunes,Miércoles,Viernes",
    Activo: true,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": "",
    "Motivo Baja": "",
    familiaId: "familia2",
    documento: "34567890"  // Campo duplicado para compatibilidad
  },
  {
    Documento: "45678901",
    "Nombre Completo": "Ana Martínez",
    Nombre: "Ana",
    Apellido: "Martínez",
    Edad: 10,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2013, 0, 1), new Date(2014, 0, 1))),
    Genero: "Femenino",
    Direccion: "Calle 789, Ciudad",
    Telefono: "456-789-0123",
    "Correo Electronico": "ana.martinez@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "Sí",
    Grupo: "A",
    Turno: "Tarde",
    "Dias Asistencia": "Martes,Jueves",
    Activo: true,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": "",
    "Motivo Baja": "",
    familiaId: "familia2",
    documento: "45678901"  // Campo duplicado para compatibilidad
  },
  {
    Documento: "56789012",
    "Nombre Completo": "Pedro Gómez",
    Nombre: "Pedro",
    Apellido: "Gómez",
    Edad: 8,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2015, 0, 1), new Date(2016, 0, 1))),
    Genero: "Masculino",
    Direccion: "Avenida 123, Ciudad",
    Telefono: "567-890-1234",
    "Correo Electronico": "pedro.gomez@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "Sí",
    Grupo: "B",
    Turno: "Mañana",
    "Dias Asistencia": "Lunes,Miércoles,Viernes",
    Activo: false,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": formatDate(randomDate(new Date(2023, 6, 1), new Date(2024, 0, 1))),
    "Motivo Baja": "Cambio de domicilio",
    familiaId: "familia3",
    documento: "56789012"  // Campo duplicado para compatibilidad
  },
  {
    Documento: "67890123",
    "Nombre Completo": "Lucía Rodríguez",
    Nombre: "Lucía",
    Apellido: "Rodríguez",
    Edad: 9,
    "Fecha Nacimiento": formatDate(randomDate(new Date(2014, 0, 1), new Date(2015, 0, 1))),
    Genero: "Femenino",
    Direccion: "Plaza 456, Ciudad",
    Telefono: "678-901-2345",
    "Correo Electronico": "lucia.rodriguez@example.com",
    "Aptitud Fisica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Ficha Medica": formatDate(randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1))),
    "Autorizacion Fotos": "No",
    Grupo: "C",
    Turno: "Tarde",
    "Dias Asistencia": "Martes,Jueves",
    Activo: false,
    "Fecha Alta": formatDate(randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1))),
    "Fecha Baja": formatDate(randomDate(new Date(2023, 6, 1), new Date(2024, 0, 1))),
    "Motivo Baja": "Traslado a otra institución",
    familiaId: "familia3",
    documento: "67890123"  // Campo duplicado para compatibilidad
  }
];

// Datos de familias de muestra
export const sampleFamilies = [
  {
    id: "familia1",
    nombre: "Familia Pérez-García",
    direccion: "Calle 123, Ciudad",
    telefono: "123-456-7890",
    miembros: [
      {
        nombre: "Roberto Pérez",
        parentesco: "Padre",
        telefono: "123-456-7890",
        correoElectronico: "roberto.perez@example.com"
      },
      {
        nombre: "Ana García",
        parentesco: "Madre",
        telefono: "123-456-7891",
        correoElectronico: "ana.garcia@example.com"
      }
    ],
    estudiantes: ["12345678", "23456789"]
  },
  {
    id: "familia2",
    nombre: "Familia López-Martínez",
    direccion: "Plaza 789, Ciudad",
    telefono: "345-678-9012",
    miembros: [
      {
        nombre: "Miguel López",
        parentesco: "Padre",
        telefono: "345-678-9012",
        correoElectronico: "miguel.lopez@example.com"
      },
      {
        nombre: "Laura Martínez",
        parentesco: "Madre",
        telefono: "345-678-9013",
        correoElectronico: "laura.martinez@example.com"
      }
    ],
    estudiantes: ["34567890", "45678901"]
  },
  {
    id: "familia3",
    nombre: "Familia Gómez-Rodríguez",
    direccion: "Avenida 123, Ciudad",
    telefono: "567-890-1234",
    miembros: [
      {
        nombre: "José Gómez",
        parentesco: "Padre",
        telefono: "567-890-1234",
        correoElectronico: "jose.gomez@example.com"
      },
      {
        nombre: "María Rodríguez",
        parentesco: "Madre",
        telefono: "567-890-1235",
        correoElectronico: "maria.rodriguez@example.com"
      }
    ],
    estudiantes: ["56789012", "67890123"]
  }
];

// Datos de intervenciones individuales de muestra
export const sampleIntervencionesIndividuales = [
  {
    id: generateId(),
    estudiante: {
      documento: "12345678",
      nombreCompleto: "Juan Pérez"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Dificultades de aprendizaje",
    descripcion: "El estudiante presenta dificultades para concentrarse durante las clases.",
    acciones: "Se realizó una evaluación inicial y se recomendó un seguimiento con el psicopedagogo.",
    resultado: "Pendiente de evaluación",
    profesionalId: "prof1",
    profesionalNombre: "Dr. Martínez"
  },
  {
    id: generateId(),
    estudiante: {
      documento: "23456789",
      nombreCompleto: "María García"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Problemas de conducta",
    descripcion: "La estudiante ha mostrado comportamientos disruptivos en clase.",
    acciones: "Se mantuvo una reunión con los padres y se estableció un plan de seguimiento.",
    resultado: "Mejora gradual",
    profesionalId: "prof2",
    profesionalNombre: "Lic. Rodríguez"
  },
  {
    id: generateId(),
    estudiante: {
      documento: "34567890",
      nombreCompleto: "Carlos López"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Evaluación psicopedagógica",
    descripcion: "Se solicita evaluación para determinar necesidades educativas específicas.",
    acciones: "Se realizaron pruebas estandarizadas y observación en el aula.",
    resultado: "Se identificaron necesidades específicas de apoyo educativo",
    profesionalId: "prof3",
    profesionalNombre: "Lic. Gómez"
  },
  {
    id: generateId(),
    estudiante: {
      documento: "45678901",
      nombreCompleto: "Ana Martínez"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Seguimiento de adaptación",
    descripcion: "Seguimiento del proceso de adaptación al centro educativo.",
    acciones: "Entrevista con la estudiante y observación en diferentes contextos.",
    resultado: "Adaptación positiva, se recomienda continuar el seguimiento",
    profesionalId: "prof1",
    profesionalNombre: "Dr. Martínez"
  }
];

// Datos de intervenciones familiares de muestra
export const sampleIntervencionesFamiliares = [
  {
    id: generateId(),
    familia: {
      id: "familia1",
      nombre: "Familia Pérez-García"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Situación económica",
    descripcion: "La familia está atravesando dificultades económicas que afectan a los estudiantes.",
    acciones: "Se proporcionó información sobre programas de asistencia y se realizó una derivación a servicios sociales.",
    resultado: "En seguimiento",
    profesionalId: "prof3",
    profesionalNombre: "Lic. Gómez"
  },
  {
    id: generateId(),
    familia: {
      id: "familia2",
      nombre: "Familia López-Martínez"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Pautas de crianza",
    descripcion: "Los padres solicitan orientación sobre pautas de crianza positiva.",
    acciones: "Se realizó un taller sobre comunicación familiar y establecimiento de límites.",
    resultado: "Mejora en la comunicación familiar",
    profesionalId: "prof2",
    profesionalNombre: "Lic. Rodríguez"
  },
  {
    id: generateId(),
    familia: {
      id: "familia3",
      nombre: "Familia Gómez-Rodríguez"
    },
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Proceso de separación",
    descripcion: "La familia está atravesando un proceso de separación que afecta emocionalmente a los estudiantes.",
    acciones: "Se brindó apoyo psicológico a los estudiantes y orientación a los padres.",
    resultado: "En proceso, se observa mejora en la adaptación de los estudiantes",
    profesionalId: "prof1",
    profesionalNombre: "Dr. Martínez"
  }
];

// Datos de intervenciones institucionales de muestra
export const sampleIntervencionesInstituciones = [
  {
    id: generateId(),
    institucionId: "inst1",
    institucionNombre: "Escuela Primaria San Martín",
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Coordinación de apoyo escolar",
    descripcion: "Reunión con directivos para coordinar el apoyo escolar a estudiantes del centro.",
    acciones: "Se estableció un plan de trabajo conjunto y un cronograma de reuniones periódicas.",
    resultado: "Acuerdo establecido",
    profesionalId: "prof1",
    profesionalNombre: "Dr. Martínez"
  },
  {
    id: generateId(),
    institucionId: "inst2",
    institucionNombre: "Centro de Salud Comunitario",
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Derivación de casos",
    descripcion: "Establecimiento de protocolo para la derivación de casos que requieren atención médica o psicológica.",
    acciones: "Se definieron criterios de derivación y canales de comunicación.",
    resultado: "Protocolo implementado",
    profesionalId: "prof2",
    profesionalNombre: "Lic. Rodríguez"
  },
  {
    id: generateId(),
    institucionId: "inst3",
    institucionNombre: "Municipalidad",
    fecha: formatDate(randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))),
    motivo: "Solicitud de recursos",
    descripcion: "Gestión de recursos para el desarrollo de actividades extracurriculares.",
    acciones: "Se presentó un proyecto y se mantuvieron reuniones con funcionarios municipales.",
    resultado: "Aprobación parcial de recursos",
    profesionalId: "prof3",
    profesionalNombre: "Lic. Gómez"
  }
];
