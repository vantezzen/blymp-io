import React from 'react';
import PropTypes from 'prop-types';
import Sync from 'react-ionicons/lib/IosSync';

import Heading from '../components/Heading';
import Section from '../components/Section';
import Spacer from '../components/Spacer';
import Transfer from '../classes/Transfer';
import { PropsWithTransfer } from '../types';

const SelectFile = ({ transfer } : PropsWithTransfer) => (
  <div>
    <Heading />

    {transfer.isSender ? (
      <Section>
        <Spacer size="15px" />

        <div className="file-input">
          <input
            type="file"
            name="files"
            id="files"
            multiple
            onChange={(event) => {
              if (!event.target.files) {
                throw new Error('View error: No files');
              }

              // eslint-disable-next-line no-param-reassign
              transfer.selectedFiles = event.target.files;
              transfer.triggerUpdate();
            }}
          />
          {/* eslint-disable-next-line */}
          <label htmlFor="files">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17">
              <path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
            </svg>
            <span>Choose files</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => transfer.uploadFiles()}
          disabled={!transfer.selectedFiles || transfer.selectedFiles.length === 0}
        >
          Start transfer
        </button>

        <p>
          Choose your files that you would like
          <br />
          to transfer to the other device.
        </p>
      </Section>
    ) : (
      <Section>
        <Sync
          rotate
          color="#FFFFFF"
          fontSize="50"
        />
        <h2>
          Waiting for your partner
          <br />
          to choose a file...
        </h2>
      </Section>
    )}
  </div>
);

SelectFile.propTypes = {
  transfer: PropTypes.instanceOf(Transfer).isRequired,
};


export default SelectFile;
