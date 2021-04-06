import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <div className="footer">
    <Link to="/compatibility">
      Compatibility check
    </Link>
    {' | '}
    <Link to="/imprint">
      Imprint
    </Link>
    <br />
    <Link to="/terms">
      Terms of Use
    </Link>
    {' | '}
    <Link to="/privacy">
      Privacy Policy
    </Link>
  </div>
);


export default Footer;
