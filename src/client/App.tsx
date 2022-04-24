import React, { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "@fontsource/montserrat";
import "@fontsource/montserrat/900.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "./app.css";

import Routes from "./Routes";
const Footer = React.lazy(
  () => import(/* webpackChunkName: "footer" */ "./components/Footer")
);

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
