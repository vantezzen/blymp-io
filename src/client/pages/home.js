import React from 'react';
import PropTypes from 'prop-types';
import CodeInput from 'react-code-input';
import { Link } from 'react-router-dom';

import Heading from '../components/Heading';
import Section from '../components/Section';
import Spacer from '../components/Spacer';
import Transfer from '../classes/Transfer';

const Home = ({ transfer }) => (
  <div>
    <Heading fullSize />

    <Section>
      <h2>Send</h2>
      <p>
        By entering a receiver code you accept
        <br />
        our
        {' '}
        <Link to="/terms" style={{ color: '#FFFFFF' }}>
          Terms of Use
        </Link>
        {' and '}
        <Link to="/privacy" style={{ color: '#FFFFFF' }}>
          Privacy Policy
        </Link>
        .
      </p>

      <CodeInput
        type="number"
        fields={4}
        className="code-input"
        autoFocus
        onChange={id => transfer.useReceiver(id)}
        inputStyleInvalid={{
          animation: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        }}
        isValid={transfer.isValidId}
      />

      <p>Enter a receiver code to send a file</p>
    </Section>

    <Spacer size="3rem" />

    <Section>
      <h2>Receive</h2>

      <p>
        By using blymp.io you accept
        <br />
        our
        {' '}
        <Link to="/terms" style={{ color: '#FFFFFF' }}>
          Terms of Use
        </Link>
        {' and '}
        <Link to="/privacy" style={{ color: '#FFFFFF' }}>
          Privacy Policy
        </Link>
        .
      </p>

      { transfer.receiverId ? (
        <CodeInput
          type="number"
          fields={4}
          className="code-input"
          value={transfer.receiverId ? String(transfer.receiverId) : ''}
          disabled
        />
      ) : (
        <div>
          Loading...
        </div>
      )}

      <p>
        Give this code to the sender
        <br />
        in order to receive a file
      </p>
    </Section>
  </div>
);

Home.propTypes = {
  transfer: PropTypes.instanceOf(Transfer).isRequired,
};


export default Home;
