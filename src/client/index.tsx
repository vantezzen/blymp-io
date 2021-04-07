import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorkerRegistration from './register-worker';

// Make sure we are on the index page
window.location.hash = '#';

// Add stylesheet for next.blymp.io
if (window.location.hostname.includes('next.blymp.io')) {
  require('./next.css');
}

const rootElement = document.getElementById("root");
if (rootElement && rootElement.hasChildNodes()) {
  ReactDOM.hydrate(<App />, rootElement);
} else {
  ReactDOM.render(<App />, rootElement);
}

serviceWorkerRegistration.register();
