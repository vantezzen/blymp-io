import React from 'react';
import Sync from 'react-ionicons/lib/IosSync';

import Heading from '../components/Heading';
import Section from '../components/Section';

const Connecting = () => (
  <div>
    <Heading />

    <Section>
      <Sync
        rotate
        color="#FFFFFF"
        fontSize="50"
      />
      <h2>Connecting...</h2>
    </Section>
  </div>
);

export default Connecting;
