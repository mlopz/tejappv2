// Script para limpiar la base de datos y agregar estudiantes de prueba
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  Timestamp,
  serverTimestamp
} = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDkhsHWP4Crb9e-rkRCjK47ALwukLjKxi0",
  authDomain: "tejapp-4b84d.firebaseapp.com",
  projectId: "tejapp-4b84d",
  storageBucket: "tejapp-4b84d.firebasestorage.app",
  messagingSenderId: "743592538012",
  appId: "1:743592538012:web:a458f74ebd172e4c1fa259",
  measurementId: "G-VK9DM1XJ0F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Colecciones
const STUDENTS_COLLECTION = 'students';
const FAMILIAS_COLLECTION = 'familias';
const INTERVENCIONES_INDIVIDUALES_COLLECTION = 'intervencionesIndividuales';
const INTERVENCIONES_FAMILIARES_COLLECTION = 'intervencionesFamiliares';

// Función para limpiar una colección
async function clearCollection(collectionName) {
  console.log(`Limpiando colección ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  
  const deletePromises = [];
  snapshot.forEach((document) => {
    deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
  });
  
  await Promise.all(deletePromises);
  console.log(`Colección ${collectionName} limpiada. Se eliminaron ${deletePromises.length} documentos.`);
}

// Función para agregar estudiantes de prueba
async function addTestStudents() {
  console.log('Agregando estudiantes de prueba...');
  
  const estudiantes = [
    {
      Documento: '59268473',
      Familia: 'Familia Pérez-González',
      Nombre: 'Juan',
      Apellido: 'Pérez',
      'Nombre Completo': 'Juan Pérez',
      Sexo: 'V',
      Edad: 12,
      'Fecha de nacimiento': '15/05/2013',
      Sipi: 'SP12345',
      Turno: 'Matutino',
      'Fecha Documento': '10/01/2023',
      'Aptitud Fisica': '15/02/2024',
      Vacunas: '20/01/2024',
      AFAM: 'Si',
      PAI: '15/12/2023',
      Fonasa: 'Si',
      'Dia de Piscina': 'Martes',
      Grado: '6°',
      Escuela: 'Escuela República de Chile',
      Activo: 'Si',
      Dirección: 'Av. Principal 123, Montevideo',
      Barrio: 'Centro',
      Teléfono: '099123456',
      'Teléfono Alternativo': '099789012',
      'Nombre del Referente': 'Ana Pérez',
      'Teléfono del Referente': '099345678',
      'Vínculo con el Referente': 'Madre',
      'Fecha de Ingreso': '10/03/2023',
      'Asistencia Regular': 'Si',
      Observaciones: 'Estudiante con buen rendimiento académico. Participa activamente en clase.',
      'Necesidades Especiales': 'No',
      'Alergias': 'Ninguna',
      'Medicación': 'Ninguna',
      'Obra Social': 'ASSE',
      'Número de Afiliado': '12345678',
      'Actividades Extracurriculares': 'Fútbol, Ajedrez',
      'Situación Familiar': 'Vive con ambos padres',
      'Nivel Socioeconómico': 'Medio',
      'Autorización Fotos': 'Si',
      'Autorización Salidas': 'Si',
      'Grupo Sanguíneo': 'O+',
      'Vacunas al Día': 'Si',
      'Nombre del Médico': 'Dr. Martínez',
      'Teléfono del Médico': '099111222',
      'Nivel de Lectura': 'Avanzado',
      'Nivel de Matemáticas': 'Intermedio',
      'Intereses': 'Deportes, Tecnología',
      'Fortalezas': 'Trabajo en equipo, Comunicación',
      'Áreas de Mejora': 'Concentración',
      'Fecha de Última Evaluación': '15/12/2024',
      'Resultado Evaluación': 'Satisfactorio',
      'Programa Especial': 'No',
      'Transporte': 'Transporte público',
      'Distancia a la Escuela': '2 km',
      'Hermanos en la Institución': '1',
      'Comentarios Adicionales': 'Estudiante muy participativo y con buena disposición para el aprendizaje.'
    },
    {
      Documento: '59570395',
      Familia: 'Familia Pérez-González',
      Nombre: 'María',
      Apellido: 'González',
      'Nombre Completo': 'María González',
      Sexo: 'M',
      Edad: 10,
      'Fecha de nacimiento': '22/08/2015',
      Sipi: 'SP23456',
      Turno: 'Vespertino',
      'Fecha Documento': '15/02/2023',
      'Aptitud Fisica': '10/03/2024',
      Vacunas: '05/02/2024',
      AFAM: 'Si',
      PAI: '20/11/2023',
      Fonasa: 'Si',
      'Dia de Piscina': 'Jueves',
      Grado: '4°',
      Escuela: 'Escuela República de Chile',
      Activo: 'Si',
      Dirección: 'Calle Secundaria 456, Montevideo',
      Barrio: 'Cordón',
      Teléfono: '099234567',
      'Teléfono Alternativo': '099890123',
      'Nombre del Referente': 'Carlos González',
      'Teléfono del Referente': '099456789',
      'Vínculo con el Referente': 'Padre',
      'Fecha de Ingreso': '15/02/2023',
      'Asistencia Regular': 'Si',
      Observaciones: 'Estudiante muy creativa. Le gusta participar en actividades artísticas.',
      'Necesidades Especiales': 'No',
      'Alergias': 'Polen',
      'Medicación': 'Antihistamínicos ocasionales',
      'Obra Social': 'ASSE',
      'Número de Afiliado': '23456789',
      'Actividades Extracurriculares': 'Danza, Pintura',
      'Situación Familiar': 'Padres separados, vive con el padre',
      'Nivel Socioeconómico': 'Medio-bajo',
      'Autorización Fotos': 'Si',
      'Autorización Salidas': 'No',
      'Grupo Sanguíneo': 'A+',
      'Vacunas al Día': 'Si',
      'Nombre del Médico': 'Dra. Rodríguez',
      'Teléfono del Médico': '099333444',
      'Nivel de Lectura': 'Intermedio',
      'Nivel de Matemáticas': 'Básico',
      'Intereses': 'Arte, Música, Literatura',
      'Fortalezas': 'Creatividad, Expresión artística',
      'Áreas de Mejora': 'Matemáticas, Puntualidad',
      'Fecha de Última Evaluación': '20/11/2024',
      'Resultado Evaluación': 'Necesita apoyo en matemáticas',
      'Programa Especial': 'No',
      'Transporte': 'A pie con acompañante',
      'Distancia a la Escuela': '500 m',
      'Hermanos en la Institución': '1',
      'Comentarios Adicionales': 'Estudiante con gran talento artístico. Se recomienda fomentar esta área.'
    },
    {
      Documento: '59638422',
      Familia: 'Familia Rodríguez',
      Nombre: 'Carlos',
      Apellido: 'Rodríguez',
      'Nombre Completo': 'Carlos Rodríguez',
      Sexo: 'V',
      Edad: 11,
      'Fecha de nacimiento': '10/11/2014',
      Sipi: 'SP34567',
      Turno: 'Matutino',
      'Fecha Documento': '05/04/2023',
      'Aptitud Fisica': '20/01/2024',
      Vacunas: '10/01/2024',
      AFAM: 'Si',
      PAI: '05/12/2023',
      Fonasa: 'No',
      'Dia de Piscina': 'Lunes',
      Grado: '5°',
      Escuela: 'Escuela República Argentina',
      Activo: 'Si',
      Dirección: 'Ruta 8 km 15, Montevideo',
      Barrio: 'Punta de Rieles',
      Teléfono: '099345678',
      'Teléfono Alternativo': '099901234',
      'Nombre del Referente': 'Laura Rodríguez',
      'Teléfono del Referente': '099567890',
      'Vínculo con el Referente': 'Madre',
      'Fecha de Ingreso': '05/04/2023',
      'Asistencia Regular': 'No',
      Observaciones: 'Estudiante con dificultades de asistencia por problemas de transporte.',
      'Necesidades Especiales': 'Si',
      'Alergias': 'Ninguna',
      'Medicación': 'Ritalin 10mg',
      'Obra Social': 'ASSE',
      'Número de Afiliado': '34567890',
      'Actividades Extracurriculares': 'Música, Informática',
      'Situación Familiar': 'Vive con madre y abuelos',
      'Nivel Socioeconómico': 'Bajo',
      'Autorización Fotos': 'No',
      'Autorización Salidas': 'Si',
      'Grupo Sanguíneo': 'B-',
      'Vacunas al Día': 'Si',
      'Nombre del Médico': 'Dr. Fernández',
      'Teléfono del Médico': '099555666',
      'Nivel de Lectura': 'Básico',
      'Nivel de Matemáticas': 'Avanzado',
      'Intereses': 'Computación, Matemáticas, Música',
      'Fortalezas': 'Resolución de problemas, Lógica',
      'Áreas de Mejora': 'Lectura, Expresión oral',
      'Fecha de Última Evaluación': '10/01/2025',
      'Resultado Evaluación': 'Requiere apoyo en lectoescritura',
      'Programa Especial': 'Si',
      'Transporte': 'Transporte escolar',
      'Distancia a la Escuela': '8 km',
      'Hermanos en la Institución': '0',
      'Comentarios Adicionales': 'Estudiante con TDAH diagnosticado. Requiere atención personalizada y seguimiento constante.'
    }
  ];
  
  for (const estudiante of estudiantes) {
    const docRef = doc(db, STUDENTS_COLLECTION, estudiante.Documento);
    await setDoc(docRef, estudiante);
    console.log(`Estudiante agregado: ${estudiante['Nombre Completo']} (${estudiante.Documento})`);
  }
  
  console.log('Estudiantes de prueba agregados correctamente.');
  return estudiantes;
}

// Función para crear una familia de prueba
async function addTestFamily(estudiantes) {
  console.log('Creando familia de prueba...');
  
  const familias = [
    {
      nombre: 'Familia Pérez-González',
      direccion: 'Av. Principal 123, Montevideo',
      telefono: '099123456',
      observaciones: 'Familia compuesta por padres y dos hijos. Buena comunicación con la institución.',
      fechaCreacion: serverTimestamp(),
      situacionEconomica: 'Media',
      tipoVivienda: 'Apartamento',
      cantidadMiembros: 4,
      ingresosMensuales: 45000,
      seguimientoSocial: 'No',
      apoyosExternos: 'Ninguno',
      referente: 'Ana Pérez (Madre)',
      telefonoReferente: '099345678',
      direccionAlternativa: 'No aplica',
      barrio: 'Centro',
      zona: 'Urbana',
      tieneServiciosBasicos: 'Si',
      condicionesHabitacionales: 'Buenas',
      situacionLaboral: 'Ambos padres trabajan',
      nivelEducativo: 'Secundaria completa',
      relacionesIntrafamiliares: 'Buenas',
      redDeApoyo: 'Familia extendida',
      miembros: [
        {
          documentoEstudiante: estudiantes[0].Documento,
          nombreEstudiante: estudiantes[0]['Nombre Completo'],
          relacion: 'Hijo'
        },
        {
          documentoEstudiante: estudiantes[1].Documento,
          nombreEstudiante: estudiantes[1]['Nombre Completo'],
          relacion: 'Hija'
        }
      ]
    },
    {
      nombre: 'Familia Rodríguez',
      direccion: 'Ruta 8 km 15, Montevideo',
      telefono: '099345678',
      observaciones: 'Familia monoparental con dificultades económicas. Requiere seguimiento.',
      fechaCreacion: serverTimestamp(),
      situacionEconomica: 'Baja',
      tipoVivienda: 'Casa',
      cantidadMiembros: 3,
      ingresosMensuales: 25000,
      seguimientoSocial: 'Si',
      apoyosExternos: 'MIDES, Plan de Equidad',
      referente: 'Laura Rodríguez (Madre)',
      telefonoReferente: '099567890',
      direccionAlternativa: 'No aplica',
      barrio: 'Punta de Rieles',
      zona: 'Periférica',
      tieneServiciosBasicos: 'Si',
      condicionesHabitacionales: 'Regulares',
      situacionLaboral: 'Madre trabaja tiempo parcial',
      nivelEducativo: 'Primaria completa',
      relacionesIntrafamiliares: 'Regulares',
      redDeApoyo: 'Abuelos maternos',
      miembros: [
        {
          documentoEstudiante: estudiantes[2].Documento,
          nombreEstudiante: estudiantes[2]['Nombre Completo'],
          relacion: 'Hijo'
        }
      ]
    }
  ];
  
  const familiasCreadas = [];
  
  for (const familia of familias) {
    const familiaRef = doc(collection(db, FAMILIAS_COLLECTION));
    await setDoc(familiaRef, familia);
    console.log(`Familia creada: ${familia.nombre} (ID: ${familiaRef.id})`);
    familiasCreadas.push({ ...familia, id: familiaRef.id });
  }
  
  console.log('Familias de prueba creadas correctamente.');
  return familiasCreadas;
}

// Función para crear intervenciones individuales de prueba
async function addTestIndividualInterventions(estudiantes) {
  console.log('Creando intervenciones individuales de prueba...');
  
  const intervenciones = [
    {
      documentoEstudiante: estudiantes[0].Documento,
      nombreEstudiante: estudiantes[0]['Nombre Completo'],
      fecha: Timestamp.fromDate(new Date('2025-03-05')),
      tipo: 'academica',
      estado: 'completada',
      descripcion: 'Intervención para mejorar el rendimiento en matemáticas. El estudiante ha mostrado dificultades con las fracciones y operaciones básicas.',
      acuerdos: 'Se acuerda realizar ejercicios adicionales en casa y asistir a clases de apoyo los martes y jueves.',
      observaciones: 'El estudiante se mostró receptivo y comprometido con mejorar su rendimiento.',
      registradoPor: {
        id: 'admin1',
        nombre: 'Administrador del Sistema'
      },
      fechaCreacion: serverTimestamp(),
      duracion: 45, // minutos
      lugar: 'Sala de reuniones',
      materiales: 'Libros de matemáticas, fichas de ejercicios',
      seguimiento: 'Semanal',
      proximaIntervencion: Timestamp.fromDate(new Date('2025-03-12')),
      resultadosEsperados: 'Mejora en la comprensión de fracciones y operaciones básicas',
      evaluacionPostIntervencion: 'Positiva, el estudiante muestra avances significativos',
      participantes: [
        {
          nombre: 'Ana Pérez',
          rol: 'Madre',
          observaciones: 'Muy comprometida con el proceso'
        },
        {
          nombre: 'Lic. Martínez',
          rol: 'Docente de apoyo',
          observaciones: 'Proporcionó material didáctico adicional'
        }
      ],
      documentosAdjuntos: [
        {
          nombre: 'Evaluación diagnóstica',
          tipo: 'Documento',
          fecha: '2025-03-01'
        }
      ],
      indicadoresSeguimiento: [
        {
          nombre: 'Rendimiento en ejercicios',
          valorInicial: '40%',
          valorActual: '65%',
          meta: '80%'
        },
        {
          nombre: 'Participación en clase',
          valorInicial: 'Baja',
          valorActual: 'Media',
          meta: 'Alta'
        }
      ]
    },
    {
      documentoEstudiante: estudiantes[1].Documento,
      nombreEstudiante: estudiantes[1]['Nombre Completo'],
      fecha: Timestamp.fromDate(new Date('2025-03-08')),
      tipo: 'conductual',
      estado: 'en_proceso',
      descripcion: 'Intervención debido a problemas de conducta durante el recreo. La estudiante ha tenido conflictos con otros compañeros.',
      acuerdos: 'Se acuerda trabajar en habilidades sociales y participar en actividades grupales supervisadas.',
      observaciones: 'Se observa mejoría en la interacción con sus compañeros, pero aún requiere seguimiento.',
      registradoPor: {
        id: 'admin1',
        nombre: 'Administrador del Sistema'
      },
      fechaCreacion: serverTimestamp(),
      duracion: 30, // minutos
      lugar: 'Patio de recreo',
      materiales: 'Juegos cooperativos, material didáctico sobre resolución de conflictos',
      seguimiento: 'Diario',
      proximaIntervencion: Timestamp.fromDate(new Date('2025-03-15')),
      resultadosEsperados: 'Mejora en la interacción social y reducción de conflictos',
      evaluacionPostIntervencion: 'En progreso, se observan mejoras parciales',
      participantes: [
        {
          nombre: 'Carlos González',
          rol: 'Padre',
          observaciones: 'Preocupado por la situación'
        },
        {
          nombre: 'Lic. Gómez',
          rol: 'Psicóloga',
          observaciones: 'Recomienda continuar con el seguimiento'
        }
      ],
      documentosAdjuntos: [
        {
          nombre: 'Informe de observación',
          tipo: 'Documento',
          fecha: '2025-03-05'
        }
      ],
      indicadoresSeguimiento: [
        {
          nombre: 'Conflictos semanales',
          valorInicial: '5',
          valorActual: '2',
          meta: '0'
        },
        {
          nombre: 'Participación en actividades grupales',
          valorInicial: 'Baja',
          valorActual: 'Media',
          meta: 'Alta'
        }
      ]
    },
    {
      documentoEstudiante: estudiantes[2].Documento,
      nombreEstudiante: estudiantes[2]['Nombre Completo'],
      fecha: Timestamp.fromDate(new Date('2025-03-10')),
      tipo: 'asistencia',
      estado: 'pendiente',
      descripcion: 'Intervención por faltas reiteradas a clase. El estudiante ha faltado 5 días en el último mes.',
      acuerdos: 'Se acuerda con la familia mejorar la asistencia y notificar previamente cuando no pueda asistir.',
      observaciones: 'La familia menciona problemas de transporte como principal causa de las inasistencias.',
      registradoPor: {
        id: 'admin1',
        nombre: 'Administrador del Sistema'
      },
      fechaCreacion: serverTimestamp(),
      duracion: 60, // minutos
      lugar: 'Oficina de dirección',
      materiales: 'Registro de asistencia, calendario escolar',
      seguimiento: 'Quincenal',
      proximaIntervencion: Timestamp.fromDate(new Date('2025-03-25')),
      resultadosEsperados: 'Reducción de inasistencias al menos en un 80%',
      evaluacionPostIntervencion: 'Pendiente de evaluación',
      participantes: [
        {
          nombre: 'Laura Rodríguez',
          rol: 'Madre',
          observaciones: 'Explica dificultades de transporte'
        },
        {
          nombre: 'Prof. Sánchez',
          rol: 'Docente',
          observaciones: 'Preocupado por el impacto en el aprendizaje'
        }
      ],
      documentosAdjuntos: [
        {
          nombre: 'Registro de asistencia',
          tipo: 'Documento',
          fecha: '2025-03-08'
        }
      ],
      indicadoresSeguimiento: [
        {
          nombre: 'Asistencia mensual',
          valorInicial: '70%',
          valorActual: '70%',
          meta: '95%'
        },
        {
          nombre: 'Notificaciones previas',
          valorInicial: 'No',
          valorActual: 'No',
          meta: 'Sí'
        }
      ]
    }
  ];
  
  for (const intervencion of intervenciones) {
    const intervencionRef = doc(collection(db, INTERVENCIONES_INDIVIDUALES_COLLECTION));
    await setDoc(intervencionRef, intervencion);
    console.log(`Intervención individual creada para ${intervencion.nombreEstudiante} (ID: ${intervencionRef.id})`);
  }
  
  console.log('Intervenciones individuales de prueba creadas correctamente.');
}

// Función para crear intervenciones familiares de prueba
async function addTestFamilyInterventions(familias) {
  console.log('Creando intervenciones familiares de prueba...');
  
  const intervenciones = [
    {
      familiaId: familias[0].id,
      nombreFamilia: familias[0].nombre,
      fecha: Timestamp.fromDate(new Date('2025-03-09')),
      tipo: 'seguimiento',
      estado: 'completada',
      descripcion: 'Intervención familiar para evaluar el ambiente familiar y el apoyo a los estudiantes en sus actividades académicas.',
      acuerdos: 'La familia se compromete a establecer horarios de estudio y a participar más activamente en las actividades escolares.',
      observaciones: 'Se observa un ambiente familiar positivo y disposición para colaborar con la institución.',
      miembrosPresentes: familias[0].miembros.map(miembro => ({
        documentoEstudiante: miembro.documentoEstudiante,
        nombreCompleto: miembro.nombreEstudiante,
        relacion: miembro.relacion
      })),
      registradoPor: {
        id: 'admin1',
        nombre: 'Administrador del Sistema'
      },
      fechaCreacion: serverTimestamp(),
      duracion: 90, // minutos
      lugar: 'Domicilio familiar',
      materiales: 'Cuestionario de evaluación familiar, guía de apoyo escolar',
      seguimiento: 'Mensual',
      proximaIntervencion: Timestamp.fromDate(new Date('2025-04-09')),
      resultadosEsperados: 'Mejora en el apoyo familiar al proceso educativo de los estudiantes',
      evaluacionPostIntervencion: 'Positiva, la familia muestra compromiso y cambios significativos',
      profesionalesPresentes: [
        {
          nombre: 'Lic. María Sánchez',
          especialidad: 'Trabajadora Social',
          observaciones: 'Realizó evaluación del entorno familiar'
        },
        {
          nombre: 'Lic. Pedro Gómez',
          especialidad: 'Psicólogo Educativo',
          observaciones: 'Proporcionó estrategias de apoyo escolar'
        }
      ],
      temasTratados: [
        'Rutinas de estudio',
        'Comunicación familiar',
        'Apoyo escolar',
        'Manejo de conflictos'
      ],
      documentosAdjuntos: [
        {
          nombre: 'Evaluación del entorno familiar',
          tipo: 'Documento',
          fecha: '2025-03-09'
        },
        {
          nombre: 'Plan de apoyo escolar',
          tipo: 'Documento',
          fecha: '2025-03-09'
        }
      ],
      indicadoresSeguimiento: [
        {
          nombre: 'Tiempo dedicado a tareas escolares',
          valorInicial: '30 min/día',
          valorActual: '60 min/día',
          meta: '90 min/día'
        },
        {
          nombre: 'Participación en reuniones escolares',
          valorInicial: 'Ocasional',
          valorActual: 'Regular',
          meta: 'Constante'
        }
      ],
      recursosProporcionados: [
        'Guía de apoyo escolar',
        'Calendario de actividades',
        'Contactos de apoyo'
      ]
    },
    {
      familiaId: familias[1].id,
      nombreFamilia: familias[1].nombre,
      fecha: Timestamp.fromDate(new Date('2025-03-15')),
      tipo: 'crisis',
      estado: 'en_proceso',
      descripcion: 'Intervención familiar por situación económica crítica que afecta el bienestar de los estudiantes.',
      acuerdos: 'Se acuerda gestionar apoyo económico a través de programas sociales y proporcionar material escolar desde la institución.',
      observaciones: 'La familia muestra preocupación y disposición para mejorar la situación, pero requiere apoyo externo.',
      miembrosPresentes: familias[1].miembros.map(miembro => ({
        documentoEstudiante: miembro.documentoEstudiante,
        nombreCompleto: miembro.nombreEstudiante,
        relacion: miembro.relacion
      })),
      registradoPor: {
        id: 'admin1',
        nombre: 'Administrador del Sistema'
      },
      fechaCreacion: serverTimestamp(),
      duracion: 120, // minutos
      lugar: 'Domicilio familiar',
      materiales: 'Formularios de programas sociales, recursos de apoyo económico',
      seguimiento: 'Semanal',
      proximaIntervencion: Timestamp.fromDate(new Date('2025-03-22')),
      resultadosEsperados: 'Mejora en la situación económica familiar y acceso a recursos básicos',
      evaluacionPostIntervencion: 'En progreso, se han iniciado gestiones de apoyo',
      profesionalesPresentes: [
        {
          nombre: 'Lic. Ana López',
          especialidad: 'Trabajadora Social',
          observaciones: 'Coordinará con MIDES para apoyo adicional'
        },
        {
          nombre: 'Dr. Roberto Méndez',
          especialidad: 'Psicólogo',
          observaciones: 'Evaluó el impacto emocional en el estudiante'
        }
      ],
      temasTratados: [
        'Situación económica',
        'Acceso a programas sociales',
        'Necesidades básicas',
        'Impacto en el rendimiento escolar'
      ],
      documentosAdjuntos: [
        {
          nombre: 'Evaluación socioeconómica',
          tipo: 'Documento',
          fecha: '2025-03-15'
        },
        {
          nombre: 'Solicitud de apoyo MIDES',
          tipo: 'Formulario',
          fecha: '2025-03-15'
        }
      ],
      indicadoresSeguimiento: [
        {
          nombre: 'Ingresos familiares',
          valorInicial: '25000 pesos',
          valorActual: '25000 pesos',
          meta: '35000 pesos'
        },
        {
          nombre: 'Acceso a alimentación adecuada',
          valorInicial: 'Parcial',
          valorActual: 'Parcial',
          meta: 'Completo'
        }
      ],
      recursosProporcionados: [
        'Información sobre programas sociales',
        'Kit de material escolar',
        'Contactos de emergencia',
        'Canasta de alimentos básicos'
      ]
    }
  ];
  
  for (const intervencion of intervenciones) {
    const intervencionRef = doc(collection(db, INTERVENCIONES_FAMILIARES_COLLECTION));
    await setDoc(intervencionRef, intervencion);
    console.log(`Intervención familiar creada para ${intervencion.nombreFamilia} (ID: ${intervencionRef.id})`);
  }
  
  console.log('Intervenciones familiares de prueba creadas correctamente.');
}

// Función principal
async function main() {
  try {
    // Limpiar colecciones
    await clearCollection(STUDENTS_COLLECTION);
    await clearCollection(FAMILIAS_COLLECTION);
    await clearCollection(INTERVENCIONES_INDIVIDUALES_COLLECTION);
    await clearCollection(INTERVENCIONES_FAMILIARES_COLLECTION);
    
    // Agregar estudiantes de prueba
    const estudiantes = await addTestStudents();
    
    // Crear familias de prueba
    const familias = await addTestFamily(estudiantes);
    
    // Crear intervenciones individuales de prueba
    await addTestIndividualInterventions(estudiantes);
    
    // Crear intervenciones familiares de prueba
    await addTestFamilyInterventions(familias);
    
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
