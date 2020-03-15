import React from 'react';
import PropTypes from 'prop-types';
import Check from 'react-ionicons/lib/IosCheckmark';

import Heading from '../components/Heading';
import Section from '../components/Section';

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
