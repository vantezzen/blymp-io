import React from 'react';
import PropTypes from 'prop-types';
import Close from 'react-ionicons/lib/IosClose';

import Heading from '../components/Heading';
import Section from '../components/Section';

type DisconnectedProps = {
  newTransfer: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

const Disconnected = ({ newTransfer } : DisconnectedProps) => (
  <div>
    <Heading />

    <Section>
      <Close
        color="#f7656d"
        fontSize="100"
      />
      <h2>Disconnected from partner</h2>
      <p>
        Your partner disconnected from this transfer.
        <br />
        Please connect again to continue your transfer.
      </p>

      <button onClick={newTransfer} type="button">
        Start new transfer
      </button>
    </Section>
  </div>
);

Disconnected.propTypes = {
  newTransfer: PropTypes.func.isRequired,
};

export default Disconnected;
