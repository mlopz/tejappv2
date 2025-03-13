// Importar las funciones necesarias de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Obtener la configuración de Firebase desde localStorage
const getFirebaseConfig = () => {
  const defaultConfig = {
    apiKey: "AIzaSyDkhsHWP4Crb9e-rkRCjK47ALwukLjKxi0",
    authDomain: "tejapp-4b84d.firebaseapp.com",
    projectId: "tejapp-4b84d",
    storageBucket: "tejapp-4b84d.appspot.com",
    messagingSenderId: "743592538012",
    appId: "1:743592538012:web:a458f74ebd172e4c1fa259",
    measurementId: "G-VK9DM1XJ0F"
  };

  try {
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('Error al cargar la configuración de Firebase:', error);
  }

  return defaultConfig;
};

// Configuración de Firebase
const firebaseConfig = getFirebaseConfig();

// Variables para almacenar las instancias de Firebase
let app;
let db;
let auth;

// Función para inicializar Firebase
const initializeFirebase = () => {
  try {
    // Si ya está inicializado, no lo inicializa de nuevo
    if (app) {
      return true;
    }
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase inicializado correctamente');
    return true;
  } catch (error) {
    console.error('Error al inicializar Firebase:', error);
    return false;
  }
};

// Función para verificar si Firebase está habilitado
const isFirebaseEnabled = () => {
  try {
    // Verificar si Firebase está habilitado en localStorage
    const useFirebase = localStorage.getItem('use_firebase');
    // Si no existe la configuración, asumimos que está habilitado
    if (useFirebase === null) {
      return true;
    }
    return useFirebase === 'true';
  } catch (error) {
    console.error('Error al verificar si Firebase está habilitado:', error);
    // Por defecto, asumimos que está habilitado
    return true;
  }
};

// Función para obtener la instancia de Firestore
const getDb = () => {
  // Si Firebase no está habilitado, no inicializamos
  if (!isFirebaseEnabled()) {
    console.warn('Firebase está deshabilitado en la configuración');
    return null;
  }
  
  // Si db no existe, inicializamos Firebase
  if (!db) {
    const initialized = initializeFirebase();
    if (!initialized) {
      console.error('No se pudo inicializar Firebase');
      return null;
    }
  }
  
  return db;
};

// Función para obtener la instancia de Auth
const getAuthInstance = () => {
  if (!isFirebaseEnabled()) {
    console.warn('Firebase está deshabilitado en la configuración');
    return null;
  }
  
  if (!auth) {
    const initialized = initializeFirebase();
    if (!initialized) {
      console.error('No se pudo inicializar Firebase');
      return null;
    }
  }
  
  return auth;
};

export { getDb as db, getAuthInstance as auth };
