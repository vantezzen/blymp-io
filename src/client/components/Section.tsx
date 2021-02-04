import React from 'react';
import PropTypes from 'prop-types';
import { ChildrenProps } from '../types';

const Section = ({ children } : ChildrenProps) => (
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
