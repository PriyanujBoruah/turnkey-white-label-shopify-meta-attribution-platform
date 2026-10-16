// TrueSignal - Firebase Web SDK configuration


const defaultFirebaseConfig = {
  apiKey: "AIzaSyAw-OecWiy3JC961FqFVm676W1mGY_8vgw",
  authDomain: "truesignal-uk.firebaseapp.com",
  projectId: "truesignal-uk",
  storageBucket: "truesignal-uk.firebasestorage.app",
  messagingSenderId: "663947772513",
  appId: "1:663947772513:web:0efaddf5369bb9ee11e020",
  measurementId: "G-GS5CT9YREK"
};

// Allow runtime override via window.FIREBASE_CONFIG or localStorage
let activeFirebaseConfig = defaultFirebaseConfig;
try {
  if (typeof window !== 'undefined' && window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.firebase) {
    activeFirebaseConfig = window.PLATFORM_CONFIG.firebase;
  } else if (typeof window !== 'undefined' && window.CUSTOM_FIREBASE_CONFIG) {
    activeFirebaseConfig = window.CUSTOM_FIREBASE_CONFIG;
  } else if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('TRUESIGNAL_FIREBASE_CONFIG');
    if (saved) {
      activeFirebaseConfig = JSON.parse(saved);
    }
  }
} catch (e) {
  console.warn('[Firebase Config] Using default configuration fallback.');
}

const firebaseConfig = activeFirebaseConfig;
