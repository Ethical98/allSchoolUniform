import firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyCZwa_sguKRxkk3j9O6WlHTS96Ma2vJfYE',
    authDomain: 'asuotp-c10eb.firebaseapp.com',
    projectId: 'asuotp-c10eb',
    storageBucket: 'asuotp-c10eb.appspot.com',
    messagingSenderId: '147859606897',
    appId: '1:147859606897:web:1895362dde448650bcfad0'
    // ApiKey: 'AIzaSyA8OQS5XBxjbfJhi5a1-6eK5dxBHqkIZ1Y',
    // AuthDomain: 'phone-auth-367c7.firebaseapp.com',
    // ProjectId: 'phone-auth-367c7',
    // StorageBucket: 'phone-auth-367c7.appspot.com',
    // MessagingSenderId: '402256591329',
    // AppId: '1:402256591329:web:9279c16ec00c826dc1faa0',
    // ApiKey: 'AIzaSyDOm6wlJeMg6yTjfLiq9T0T2tAazE04F_w',
    // AuthDomain: 'stellar-operand-235412.firebaseapp.com',
    // DatabaseURL: 'https://stellar-operand-235412.firebaseio.com',
    // ProjectId: 'stellar-operand-235412',
    // StorageBucket: 'stellar-operand-235412.appspot.com',
    // MessagingSenderId: '359500411951',
    // AppId: '1:359500411951:web:b0ddcc0dd1d49d4677c2da',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const imageStorage = firebase.storage();

export default firebase;
export { imageStorage };
