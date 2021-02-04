import React, {Suspense} from 'react';
import {
  HashRouter as Router,
} from 'react-router-dom';
import '@openfonts/gothic-a1_latin';
import './app.css';

import Routes from './Routes';
const Footer = React.lazy(() => import(/* webpackChunkName: "footer" */ './components/Footer'));

const App = () => (
  <Router>
    <div>
      <Routes />
      <Suspense fallback={<div />}>
        <Footer />
      </Suspense>
    </div>
  </Router>
);

export default App;
