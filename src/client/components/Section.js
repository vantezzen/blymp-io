import React from 'react';
import PropTypes from 'prop-types';

const Section = ({ children }) => (
  <div className="section-container">
    <div className="section">
      <div>
        { children }
      </div>
    </div>
  </div>
);

Section.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Section;
