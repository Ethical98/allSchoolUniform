import firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: 'asuotp-c10eb.firebaseapp.com',
    projectId: 'asuotp-c10eb',
    storageBucket: 'asuotp-c10eb.appspot.com',
    messagingSenderId: '147859606897',
    appId: '1:147859606897:web:1895362dde448650bcfad0'
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const imageStorage = firebase.storage();

export default firebase;
export { imageStorage };
