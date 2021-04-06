import React from 'react';
import PropTypes from 'prop-types';
import Planet from 'react-ionicons/lib/MdPlanet';
import { Link } from 'react-router-dom';

import Spacer from './Spacer';

type HeadingProps = {
  fullSize: boolean
}

const Heading = ({ fullSize } : HeadingProps) => (
  <div className="heading">
    <Link to="/">
      <Planet
        fontSize="100"
        color="#FFFFFF"
      />
    </Link>
    {fullSize && (
      <>
        <h1>
          {window.location.hostname.includes('next.blymp.io') ? (
            <span style={{ fontFamily: 'monospace', fontWeight: 'lighter' }}>next.blymp.io</span>
          ) : 'blymp.io'}
        </h1>
        <p style={{ color: '#B4B4B4', marginTop: 0 }}>Transfer files between any device</p>
      </>
    )}

    <Spacer size="3rem" />
  </div>
);

Heading.propTypes = {
  fullSize: PropTypes.bool,
};

Heading.defaultProps = {
  fullSize: false,
};

export default Heading;
