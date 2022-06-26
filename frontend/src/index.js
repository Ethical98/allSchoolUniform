import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import 'react-bootstrap-typeahead/css/Typeahead.css';
// Import '@fortawesome/fontawesome-free/css/all.min.css';
// Import 'bootstrap-css-only/css/bootstrap.min.css';
// Import 'mdbreact/dist/css/mdb.css';
// Import 'mdb-react-ui-kit/dist/css/mdb.min.css';
// Import './mdb.min.css';
// Import './bootstrap.min.css';
// Import './styles.css';
import './styles/style.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// To log results (for example: reportWebVitals(console.log))
// Or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
