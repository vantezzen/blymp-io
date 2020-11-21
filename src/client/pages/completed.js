import React from 'react';
import PropTypes from 'prop-types';
import Check from 'react-ionicons/lib/IosCheckmark';

import Heading from '../components/Heading';
import Section from '../components/Section';
import bmcLogo from '../assets/bmc.png';

const Completed = ({ newTransfer }) => (
  <div>
    <Heading />

    <Section>
      <Check
        color="#64fa82"
        fontSize="100"
      />
      <h2>Completed your transfer</h2>
      <p>
        Your download is done.
        <br />
        Thank you for using blymp.io for transferring files.
      </p>
      <p>Do you like blymp.io? Why not tell your friends about it?</p>
      <p>Also, if you really like blymp.io, please consider donating so I can keep this service alive:</p>
      <a href="https://www.buymeacoffee.com/vantezzen" target="_blank">
        <img src={bmcLogo} alt="Buy Me A Coffee" width="150" />
      </a>

      <button onClick={newTransfer} type="button">
        Start new transfer
      </button>
    </Section>
  </div>
);

Completed.propTypes = {
  newTransfer: PropTypes.func.isRequired,
};

export default Completed;
