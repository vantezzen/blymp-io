import React, { Suspense } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import Section from "../components/Section";
import Spacer from "../components/Spacer";
import Separator from "../components/Separator";
import Transfer from "../classes/Transfer";

import ConnectImg from "../assets/tutorial-connect.svg";
import CodeImg from "../assets/tutorial-code.svg";
import SelectImg from "../assets/tutorial-select.svg";
import TransferImg from "../assets/tutorial-transfer.svg";

import faqContent from "../assets/faq-content";
import blurredBg from "../assets/blurred.png";

import "./home.css";
import { PropsWithTransfer } from "../types";
import CookieConsent from "../components/CookieConsent";

const Heading = React.lazy(
  () =>
    import(/* webpackChunkName: "components-heading" */ "../components/Heading")
);
const InfoCircle = React.lazy(
  () =>
    import(
      /* webpackChunkName: "ionicons-info-circle" */ "react-ionicons/lib/IosWarningOutline"
    )
);
const CodeInput = React.lazy(
  () => import(/* webpackChunkName: "react-code-input" */ "react-code-input")
);
const Faq = React.lazy(
  () =>
    import(/* webpackChunkName: "react-faq-component" */ "react-faq-component")
);

const Home = ({ transfer }: PropsWithTransfer) => (
  <div>
    <CookieConsent />
    <div className="home-top" style={{ backgroundImage: `url(${blurredBg})` }}>
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
        <div className="home-content">
          <Section>
            <h3 className="text-secondary">I want to</h3>
            <h2 className="text-primary underline mb-8">
              receive files
              <br />
              from another person
            </h2>

            {transfer.receiverId ? (
              <Suspense fallback={<div />}>
                <CodeInput
                  type="number"
                  name="receiverId"
                  inputMode="numeric"
                  fields={4}
                  className="code-input"
                  value={transfer.receiverId ? String(transfer.receiverId) : ""}
                  disabled
                />
              </Suspense>
            ) : (
              <div>Loading...</div>
            )}

            <p>
              Give this code to the sender
              <br />
              to receive files from them
            </p>

            <p className="small-info">
              By using blymp.io you accept
              <br />
              our{" "}
              <Link to="/terms" style={{ color: "#212121" }}>
                Terms of Use
              </Link>
              {" and "}
              <Link to="/privacy" style={{ color: "#212121" }}>
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Spacer size="3rem" />

          <Section>
            <h3 className="text-secondary">I want to</h3>
            <h2 className="text-primary underline mb-8">
              send files
              <br />
              to another person
            </h2>

            <Suspense fallback={<div />}>
              <CodeInput
                type="number"
                name="senderId"
                inputMode="numeric"
                fields={4}
                className="code-input"
                autoFocus
                onChange={(id) => transfer.useReceiver(Number(id))}
                inputStyleInvalid={{
                  animation: "shake 0.82s cubic-bezier(.36,.07,.19,.97) both",
                }}
                isValid={transfer.isValidId}
              />
            </Suspense>

            <p>
              Enter the code given to you by
              <br />
              the receiver to send a file to them
            </p>

            <p className="small-info">
              By entering a receiver code you accept
              <br />
              our{" "}
              <Link to="/terms" style={{ color: "#212121" }}>
                Terms of Use
              </Link>
              {" and "}
              <Link to="/privacy" style={{ color: "#212121" }}>
                Privacy Policy
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>

      <Separator />
    </div>

    <div id="700285345"></div>

    <h2 id="about-us">
      <span className="underline">What's blymp.io?</span>
    </h2>
    <div className="centered">
      <div className="about-us-container">
        <p>
          Frustrated by existing solutions, we created blymp.io to enable
          bullsh*t free, privacy-oriented file transfers between devices.
        </p>
        <p>
          Using blymp.io, files will be transferred directly instead of being
          uploaded to a server (if supported by both devices) - making it
          blazingly fast and ensuring that your data can't be stored by us.
        </p>
        <p>
          We've also added some nice additions like automatic compression and
          decompression and fallback methods for older devices to ensure files
          are sent as efficiently as possible.
        </p>
        <p>
          blymp.io is free and it's code is open source so you can verify
          exactly what blymp is doing behind the scenes.
        </p>
      </div>
    </div>

    <Separator />

    <h2 id="how-it-works">
      <span className="underline">How do I use it?</span>
    </h2>
    <div className="feature">
      <img src={ConnectImg} alt="Connect" />

      <div>
        <h3>1. Open blymp.io</h3>
        <p>
          Open blymp.io on your device you want to send files from and your
          device you want to receive files on.
        </p>
      </div>
    </div>

    <div className="feature reverse">
      <div>
        <h3>2. Exchange the code</h3>
        <p>
          The device you want to receive files on will show a 4-digit code.
          <br />
          Enter this code on the device you want to send files from.
        </p>
      </div>

      <img src={CodeImg} alt="Exchange the code" />
    </div>

    <div className="feature">
      <img src={SelectImg} alt="Select files" />

      <div>
        <h3>3. Select your files</h3>
        <p>Select one or multiple files you want to transfer.</p>
      </div>
    </div>

    <div className="feature reverse">
      <div>
        <h3>4. Transfer!</h3>
        <p>
          Your files will be transferred with the highest speed possible.
          <br />
          If your devices support it, all files will be transferred Peer-to-Peer
          - so that they don't even have to pass our servers.
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
