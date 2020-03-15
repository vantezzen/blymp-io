import React from 'react';
import PropTypes from 'prop-types';

const Spacer = ({ size }) => (
  <div style={{ marginBottom: size }} />
);

Spacer.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default Spacer;
