import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// eslint-disable-next-line no-unused-vars
import App from './App';
import reportWebVitals from './reportWebVitals';

const element = React.createElement('h1', {className: 'greeting'}, 'Hello!');

ReactDOM.render(
    element,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
