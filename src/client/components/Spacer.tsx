import React from 'react';
import PropTypes from 'prop-types';

type SpacerProps = {
  size: number | string,
}

const Spacer = ({ size } : SpacerProps) => (
  <div style={{ marginBottom: size }} />
);

Spacer.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default Spacer;
