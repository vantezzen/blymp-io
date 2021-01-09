import React from 'react';
import {
  HashRouter as Router,
} from 'react-router-dom';
import '@openfonts/gothic-a1_latin';
import './app.css';

import Routes from './Routes';
import Footer from './components/Footer';

const App = () => (
  <Router>
    <div>
      <Routes />
      <Footer />
    </div>
  </Router>
);

export default App;
