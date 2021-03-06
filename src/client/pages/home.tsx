import React, {Suspense} from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Section from '../components/Section';
import Spacer from '../components/Spacer';
import Separator from '../components/Separator';
import Checktext from '../components/Checktext';
import Transfer from '../classes/Transfer';

import ConnectImg from '../assets/tutorial-connect.svg';
import CodeImg from '../assets/tutorial-code.svg';
import SelectImg from '../assets/tutorial-select.svg';
import TransferImg from '../assets/tutorial-transfer.svg';

import faqContent from '../assets/faq-content';

import './home.css';
import { PropsWithTransfer } from '../types';

const Heading = React.lazy(() => import(/* webpackChunkName: "components-heading" */ '../components/Heading'));
const InfoCircle = React.lazy(() => import(/* webpackChunkName: "ionicons-info-circle" */ 'react-ionicons/lib/IosWarningOutline'));
const CodeInput = React.lazy(() => import(/* webpackChunkName: "react-code-input" */ 'react-code-input'));
const Faq = React.lazy(() => import(/* webpackChunkName: "react-faq-component" */ 'react-faq-component'));

const Home = ({ transfer } : PropsWithTransfer) => (
  <div>
    <Suspense fallback={<div />}>
      <Heading fullSize />
    </Suspense>

    {!window.Blob && (
      <>
        <Section>
          <Suspense fallback={<div />}>
            <InfoCircle color="#FFFFFF" fontSize="50" />
          </Suspense>
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
          <Suspense fallback={<div />}>
            <CodeInput
              type="number"
              name="receiverId"
              inputMode="numeric"
              fields={4}
              className="code-input"
              value={transfer.receiverId ? String(transfer.receiverId) : ''}
              disabled
            />
          </Suspense>
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

        <Suspense fallback={<div />}>
          <CodeInput
            type="number"
            name="senderId"
            inputMode="numeric"
            fields={4}
            className="code-input"
            autoFocus
            onChange={id => transfer.useReceiver(Number(id))}
            inputStyleInvalid={{
              animation: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
            }}
            isValid={transfer.isValidId}
          />
        </Suspense>

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

      <Spacer size="3rem" />

      <Section>
        <h2>Why blymp.io</h2>

        <Checktext>
          Very fast
        </Checktext>
        <Checktext>
          No registration
        </Checktext>
        <Checktext>
          Privacy-oriented
        </Checktext>
        <Checktext>
          Free
        </Checktext>
        <Checktext>
          Open-source
        </Checktext>
        You can learn more about blymp.io below.
      </Section>
    </div>

    <Separator />

    {window.location.hostname.includes('next.blymp.io') && (
      <>
        <Section>
          <div style={{ margin: 30 }}>
            <h2>Welcome to next.blymp.io!</h2>
            <p>
              Thank you for testing the newest features of blymp.io.<br />
              If you find any bugs or have other feedback, please post it on <a href="https://github.com/vantezzen/blymp-io/issues">https://github.com/vantezzen/blymp-io/issues</a>.
            </p>
            <p>
              Please keep in mind that this site runs independent from the normal blymp.io,<br />
              meaning that the 4-digit codes from the normal blymp.io won't work here and vice versa. 
            </p>
          </div>
        </Section>

        <Spacer size="3rem" />
      </>
    )}

    <h2 id="how-it-works">How it works</h2>
    <div className="feature">
      <img src={ConnectImg} alt="Connect" />

      <div>
        <h3>
          1. Open blymp.io
        </h3>
        <p>
          Open blymp.io on your device you want to send files from and your device you want to receive files on.
        </p>
      </div>
      
    </div>

    <div className="feature reverse">
      <div>
        <h3>
          2. Exchange the code
        </h3>
        <p>
          The device you want to receive files on will show a 4-digit code.<br />
          Enter this code on the device you want to send files from.
        </p>
      </div>
      
      <img src={CodeImg} alt="Exchange the code" />
    </div>

    <div className="feature">
      <img src={SelectImg} alt="Select files" />

      <div>
        <h3>
          3. Select your files
        </h3>
        <p>
          Select one or multiple files you want to transfer.
        </p>
      </div>
      
    </div>

    <div className="feature reverse">
      <div>
        <h3>
          4. Transfer!
        </h3>
        <p>
          Your files will be transferred with the highest speed possible.<br />
          If your devices support it, all files will be transferred Peer-to-Peer - so that they don't even have to pass our servers.
        </p>
      </div>
      
      <img src={TransferImg} alt="Transfer files" />
    </div>

    <h2>FAQ</h2>
    <div className="faq-area-container">
      <div className="faq-area">
        <Suspense fallback={<div />}>
          <Faq data={faqContent} />
        </Suspense>
      </div>
    </div>
  </div>
);

Home.propTypes = {
  transfer: PropTypes.instanceOf(Transfer).isRequired,
};


export default Home;
