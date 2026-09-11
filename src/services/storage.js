import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  arrayUnion, 
  query, 
  where 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

const STORAGE_KEY_PREFIX = "mavltask_project_tasks_";
const CONFIG_KEY = "mavltask_firebase_config";
const USER_PROFILE_KEY = "mavltask_user_profile";

// 1. Obtener Perfil Local / Sesión
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
  const defaultUser = {
    id: randomId,
    name: 'Invitado',
    email: '',
    photoURL: '',
    isAnonymous: true
  };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultUser));
  return defaultUser;
}

export function saveUserProfile(user) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
}

// 2. Firebase Config
export function getStoredFirebaseConfig() {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }

  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;

export function getFirebaseServices() {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null, auth: null };
  }
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  } catch (err) {
    console.error("Error al inicializar Firebase:", err);
    return { app: null, db: null, auth: null };
  }
}

export function initFirebase() {
  const { db } = getFirebaseServices();
  return db;
}

// 3. Métodos de Autenticación con Firebase Auth
export function subscribeToAuth(callback) {
  const { auth } = getFirebaseServices();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const userProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        photoURL: user.photoURL || '',
        isAnonymous: false,
        provider: user.providerData?.[0]?.providerId || 'password'
      };
      saveUserProfile(userProfile);
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}

export async function loginWithGoogle() {
  const { auth } = getFirebaseServices();
  if (!auth) throw new Error("Firebase no está configurado. Conéctalo desde el botón de Base de Datos.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const u = result.user;
  const userProfile = {
    id: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'Usuario',
    email: u.email || '',
    photoURL: u.photoURL || '',
    isAnonymous: false,
    provider: 'google.com'
  };
  saveUserProfile(userProfile);
  return userProfile;
}

export async function loginWithEmail(email, password) {
  const { auth } = getFirebaseServices();
  if (!auth) throw new Error("Firebase no está configurado. Conéctalo desde el botón de Base de Datos.");
  const result = await signInWithEmailAndPassword(auth, email, password);
  const u = result.user;
  const userProfile = {
    id: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'Usuario',
    email: u.email || '',
    photoURL: u.photoURL || '',
    isAnonymous: false,
    provider: 'password'
  };
  saveUserProfile(userProfile);
  return userProfile;
}

export async function registerWithEmail(email, password, displayName) {
  const { auth } = getFirebaseServices();
  if (!auth) throw new Error("Firebase no está configurado. Conéctalo desde el botón de Base de Datos.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const u = result.user;
  if (displayName && u) {
    await updateProfile(u, { displayName });
  }
  const userProfile = {
    id: u.uid,
    name: displayName || u.email?.split('@')[0] || 'Usuario',
    email: u.email || '',
    photoURL: u.photoURL || '',
    isAnonymous: false,
    provider: 'password'
  };
  saveUserProfile(userProfile);
  return userProfile;
}

export async function logoutUser() {
  const { auth } = getFirebaseServices();
  if (auth) {
    await signOut(auth);
  }
  const defaultUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: 'Invitado',
    email: '',
    photoURL: '',
    isAnonymous: true
  };
  saveUserProfile(defaultUser);
  return defaultUser;
}

// 4. LocalStorage Fallbacks para Proyectos y Tareas
export function getLocalProjects() {
  const user = getUserProfile();
  try {
    const raw = localStorage.getItem("mavltask_local_projects");
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  
  const defaultProj = [{
    id: "proj_demo",
    name: "Proyecto Demo MavlTask",
    description: "Espacio de trabajo compartido para desarrollo colaborativo",
    key: "MAVL",
    ownerId: user.id,
    members: [
      { id: user.id, name: user.name, email: user.email || "mi_usuario@mavltask.app" },
      { id: "usr_carlos", name: "Carlos Dev", email: "carlos@empresa.com" },
      { id: "usr_ana", name: "Ana QA", email: "ana@empresa.com" }
    ],
    createdAt: new Date().toISOString()
  }];
  localStorage.setItem("mavltask_local_projects", JSON.stringify(defaultProj));
  return defaultProj;
}

export function saveLocalProjects(projects) {
  localStorage.setItem("mavltask_local_projects", JSON.stringify(projects));
}

export function getLocalTasksByProject(projectId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [];
}

export function saveLocalTasksByProject(projectId, tasks) {
  localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(tasks));
}
