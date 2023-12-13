import { initializeApp } from "firebase/app";
import { getStorage, ref } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: 'AIzaSyCqumrbjUy-EoMpfN4Ev0ppnqjkdpnOTTw',
    authDomain: 'koios-academy.firebaseapp.com',
    databaseURL: 'https://koios-academy-default-rtdb.firebaseio.com',
    projectId: 'koios-academy',
    storageBucket: 'koios-academy.appspot.com',
    messagingSenderId: '194603970266',
    appId: '1:194603970266:web:ffa1fdfc8face715e8bfe3',
    measurementId: 'G-7T59B8GS05'
};  
  
// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseStorage = getStorage(firebaseApp);
export const firebaseCloudstore = getFirestore(firebaseApp);
export const firebaseProfilePicturesRef = ref(firebaseStorage, 'pfp/');