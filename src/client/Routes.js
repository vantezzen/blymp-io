import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Switch,
  Route,
  useHistory,
  withRouter,
} from 'react-router-dom';
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group';
import '@openfonts/gothic-a1_latin';
import './app.css';

import Transfer from './classes/Transfer';

import Home from './pages/home';
import Connecting from './pages/connecting';
import SelectFile from './pages/select-file';
import TransferPage from './pages/transfer';
import Completed from './pages/completed';
import Disconnected from './pages/disconected';
import Terms from './pages/legal/terms';
import Privacy from './pages/legal/privacy';
import Imprint from './pages/legal/imprint';
import Compatibility from './pages/compatibility';

const defaultTransfer = new Transfer();

const Routes = ({ location }) => {
  const [transfer, setTransfer] = useState(defaultTransfer);
  const [update, updateComponent] = useState(false);
  const history = useHistory();

  const triggerUpdate = () => {
    updateComponent(!update);
  };
  transfer.updateHandler = triggerUpdate;

  const openPage = (page) => {
    history.push(page);
  };
  transfer.openPage = openPage;

  const newTransfer = () => {
    setTransfer(new Transfer());
    openPage('/');
  };

  history.listen(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        timeout={500}
        classNames="fade"
      >
        <Switch location={location}>
          <Route path="/connecting">
            <Connecting />
          </Route>
          <Route path="/select-file">
            <SelectFile transfer={transfer} />
          </Route>
          <Route path="/transfer">
            <TransferPage transfer={transfer} />
          </Route>
          <Route path="/completed">
            <Completed newTransfer={() => newTransfer()} />
          </Route>
          <Route path="/disconnected">
            <Disconnected newTransfer={() => newTransfer()} />
          </Route>
          <Route path="/privacy">
            <Privacy />
          </Route>
          <Route path="/terms">
            <Terms />
          </Route>
          <Route path="/imprint">
            <Imprint />
          </Route>
          <Route path="/compatibility">
            <Compatibility />
          </Route>
          <Route path="/">
            <Home transfer={transfer} />
          </Route>
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
};

Routes.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  location: PropTypes.object.isRequired,
};

export default withRouter(Routes);
