import React from 'react';
import PropTypes from 'prop-types';
import CodeInput from 'react-code-input';
import { Link } from 'react-router-dom';
import InfoCircle from 'react-ionicons/lib/IosWarningOutline';

import Heading from '../components/Heading';
import Section from '../components/Section';
import Spacer from '../components/Spacer';
import Transfer from '../classes/Transfer';

import './home.css';

const Home = ({ transfer }) => (
  <div>
    <Heading fullSize />

    {!window.Blob && (
      <>
        <Section>
          <InfoCircle color="#FFFFFF" fontSize="50" />
          <br />
          Your device does not support the technologies
          <br />
          needed to make blymp.io work.
          <br />
          <br />
          Please try using a more modern browser
          <br />
          or enabling JavaScript Blobs.
        </Section>
        <Spacer size="3rem" />
      </>
    )}

    <div className="home-sections">
      <Section>
        <h2>Receive</h2>

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
          Give this code to another person
          <br />
          in order to receive a file from them
        </p>

        <p className="small-info">
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
      </Section>

      <Spacer size="3rem" />

      <Section>
        <h2>Send</h2>

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

        <p>
          Enter the code given to your by
          <br />
          the receiver to send a file to them
        </p>

        <p className="small-info">
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
      </Section>
    </div>
  </div>
);

Home.propTypes = {
  transfer: PropTypes.instanceOf(Transfer).isRequired,
};


export default Home;
