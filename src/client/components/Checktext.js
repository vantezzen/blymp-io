import React from 'react';
import PropTypes from 'prop-types';
import Checkmark from 'react-ionicons/lib/IosCheckmarkCircle';

const Checktext = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
    <Checkmark 
      fontSize="25"
      color="#FFFFFF"
      style={{ paddingRight: 10 }}
    />
    { children }
  </div>
);

Checktext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Checktext;
