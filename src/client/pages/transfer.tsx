import React from 'react';
import PropTypes from 'prop-types';
import { Line } from 'rc-progress';

import Heading from '../components/Heading';
import Section from '../components/Section';
import TransferClass from '../classes/Transfer';
import { PropsWithTransfer } from '../types';

const roundToOneDecimal = (num : number) => Math.round(num * 10) / 10;

// Format seconds into a better-readable format like hours or minutes
const formatSeconds = (seconds : number) => {
  if (seconds > 3600) {
    return `${roundToOneDecimal(seconds / 3600)}h`;
  }
  if (seconds > 60) {
    return `${Math.round(seconds / 60)}min`;
  }
  return `${seconds}s`;
};

const Transfer = ({ transfer } : PropsWithTransfer) => (
  <div>
    <Heading />

    <Section>
      <Line
        percent={transfer.progress}
        strokeWidth={20}
        strokeColor="#8641D4"
        strokeLinecap="butt"
        trailWidth={20}
        trailColor="#FFFFFF"
        style={{
          height: '3rem',
          width: '100%',
          borderRadius: 15,
        }}
      />
      <h2>{ transfer.transferStatusText }</h2>
      <p style={{ color: '#B4B4B4', lineHeight: 2 }}>
        {`${formatSeconds(transfer.estimate)} left for this file`}
        <br />
        {`Currently transferring "${transfer.currentFileName}"`}
        <br />
        {`File ${transfer.currentFile + 1} of ${transfer.totalFiles}`}
        <br />
        {`Using ${transfer.connection.method === 'webrtc' ? 'WebRTC' : 'WebSockets'} transfer`}
      </p>
    </Section>
  </div>
);

Transfer.propTypes = {
  transfer: PropTypes.instanceOf(TransferClass).isRequired,
};

export default Transfer;
