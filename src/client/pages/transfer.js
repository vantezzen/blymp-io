import React from 'react';
import PropTypes from 'prop-types';
import { Line } from 'rc-progress';

import Heading from '../components/Heading';
import Section from '../components/Section';
import TransferClass from '../classes/Transfer';

const Transfer = ({ transfer }) => (
  <div>
    <Heading />

    <Section>
      <Line
        percent={transfer.progress}
        strokeWidth={20}
        strokeColor="#8641D4"
        trailWidth={20}
        trailColor="#FFFFFF"
      />
      <h2>Transferring files...</h2>
      <p style={{ color: '#B4B4B4' }}>
        {`${transfer.estimate}s left`}
        <br />
        {`File ${transfer.currentFile} of ${transfer.totalFiles}`}
        <br />
        {`Using ${transfer.method === 'webrtc' ? 'WebRTC' : 'WebSockets'} transfer`}
      </p>
    </Section>
  </div>
);

Transfer.propTypes = {
  transfer: PropTypes.instanceOf(TransferClass).isRequired,
};

export default Transfer;
