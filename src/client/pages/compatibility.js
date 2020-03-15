import React from 'react';
import PropTypes from 'prop-types';
import Check from 'react-ionicons/lib/MdCheckmark';
import Cross from 'react-ionicons/lib/MdClose';
import Happy from 'react-ionicons/lib/IosHappyOutline';
import Sad from 'react-ionicons/lib/IosSadOutline';
import SimplePeer from 'simple-peer';

import Heading from '../components/Heading';
import Section from '../components/Section';

const Status = ({ isCompatible }) => (
  <>
    {isCompatible
      ? <Check color="#64fa82" />
      : <Cross color="#f7656d" />}
  </>
);
Status.propTypes = {
  isCompatible: PropTypes.bool.isRequired,
};

const Compatibility = () => {
  const compatibilities = {};

  compatibilities.webrtc = SimplePeer.WEBRTC_SUPPORT;
  compatibilities.sockets = 'WebSocket' in window || 'MozWebSocket' in window;
  compatibilities.blob = !!window.Blob;

  /**
   * Possible status:
   * 0 - Fully compatible
   * 1 - Compatible but with lower speeds (no WebRTC)
   * 2 - Compatible but with very low speeds (no WebRTC and no WebSockets)
   * 3 - Not compatible
   */
  let status = 0;
  if (!compatibilities.webrtc) {
    status = 1;
  }
  if (!compatibilities.webrtc && !compatibilities.sockets) {
    status = 2;
  }
  if (!compatibilities.blob) {
    status = 3;
  }

  return (
    <div>
      <Heading />

      <Section>
        <h2>Compatibility Check</h2>

        { status === 0 && (
          <>
            <Happy color="#64fa82" fontSize="70" />
            <h4>Your browser is fully compatible</h4>
          </>
        ) }
        { status === 1 && (
          <>
            <Happy color="#eeff6e" fontSize="70" />
            <h4>
              Your browser is compatible but files may not transfer with the fastest speed possible
            </h4>
            <p>Try using a modern browser or enabling WebRTC to improve transfer speeds</p>
          </>
        ) }
        { status === 2 && (
          <>
            <Happy color="#ffb580" fontSize="70" />
            <h4>
              Your browser is compatible but files may transfer with low speeds
            </h4>
            <p>
              Try using a modern browser or enabling
              WebRTC and WebSockets to improve transfer speeds
            </p>
          </>
        ) }
        { status === 3 && (
          <>
            <Sad color="#f7656d" fontSize="70" />
            <h4>Your browser is not compatible</h4>
            <p>Try using a modern browser or enabling features like WebSockets and Blobs</p>
          </>
        ) }

        <table style={{ width: '100%' }} className="compatibility">
          <tbody>
            <tr>
              <td className="pb-3">
                <h5>
                  <Status isCompatible={compatibilities.webrtc} />
                  WebRTC (optional)
                </h5>
                blymp.io uses WebRTC to enable faster and more direct file transfers.
              </td>
            </tr>
            <tr>
              <td className="pb-3">
                <h5>
                  <Status isCompatible={compatibilities.sockets} />
                  WebSockets (optional)
                </h5>
                blymp.io uses WebSockets for communication with our
                servers and as a fallback method when trying to transfer files.
              </td>
            </tr>
            <tr>
              <td className="pb-3">
                <h5>
                  <Status isCompatible={compatibilities.blob} />
                  Blobs
                </h5>
                blymp.io uses blobs to reassemble transferred
                files in your browser before downloading them.
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
};

export default Compatibility;
