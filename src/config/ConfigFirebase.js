import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence} from 'firebase/auth/react-native';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC04D-hBDx_qIXDp2OJjzkYyOAbHEZ005w",
  authDomain: "gymmahmoud-c42f9.firebaseapp.com",
  projectId: "gymmahmoud-c42f9",
  storageBucket: "gymmahmoud-c42f9.appspot.com",
  messagingSenderId: "782526872311",
  appId: "1:782526872311:web:2626df8c53554097ff71f2",
  measurementId: "G-2N12LZ3Z53"
};

const app = initializeApp(firebaseConfig);

// initialize auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export {auth};