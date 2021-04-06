import React, { useState, Suspense } from 'react';
import {
  Switch,
  Route,
  useHistory,
  withRouter,
  RouteComponentProps,
} from 'react-router-dom';
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group';
import '@openfonts/gothic-a1_latin';
import './app.css';

import Transfer from './classes/Transfer';

const Home = React.lazy(() => import(/* webpackChunkName: "home" */ './pages/home'));
const Connecting = React.lazy(() => import(/* webpackChunkName: "connecting" */ './pages/connecting'));
const SelectFile = React.lazy(() => import(/* webpackChunkName: "select-file" */ './pages/select-file'));
const TransferPage = React.lazy(() => import(/* webpackChunkName: "transfer" */ './pages/transfer'));
const Completed = React.lazy(() => import(/* webpackChunkName: "completed" */ './pages/completed'));
const Disconnected = React.lazy(() => import(/* webpackChunkName: "disconnected" */ './pages/disconected'));
const Terms = React.lazy(() => import(/* webpackChunkName: "legal-terms" */ './pages/legal/terms'));
const Privacy = React.lazy(() => import(/* webpackChunkName: "legal-privacy" */ './pages/legal/privacy'));
const Imprint = React.lazy(() => import(/* webpackChunkName: "legal-imprint" */ './pages/legal/imprint'));
const Compatibility = React.lazy(() => import(/* webpackChunkName: "compatability" */ './pages/compatibility'));

const defaultTransfer = new Transfer();

const Routes = ({ location } : RouteComponentProps) => {
  const [transfer, setTransfer] = useState(defaultTransfer);
  const [update, updateComponent] = useState(false);
  const history = useHistory();

  const triggerUpdate = () => {
    updateComponent(!update);
  };
  transfer.updateHandler = triggerUpdate;

  const openPage = (page: string) => {
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
            <Suspense fallback={<div>Loading...</div>}>
              <Connecting />
            </Suspense>
          </Route>
          <Route path="/select-file">
            <Suspense fallback={<div>Loading...</div>}>
              <SelectFile transfer={transfer} />
            </Suspense>
          </Route>
          <Route path="/transfer">
            <Suspense fallback={<div>Loading...</div>}>
              <TransferPage transfer={transfer} />
            </Suspense>
          </Route>
          <Route path="/completed">
            <Suspense fallback={<div>Loading...</div>}>
              <Completed newTransfer={() => newTransfer()} />
            </Suspense>
          </Route>
          <Route path="/disconnected">
            <Suspense fallback={<div>Loading...</div>}>
              <Disconnected newTransfer={() => newTransfer()} />
            </Suspense>
          </Route>
          <Route path="/privacy">
            <Suspense fallback={<div>Loading...</div>}>
              <Privacy />
            </Suspense>
          </Route>
          <Route path="/terms">
            <Suspense fallback={<div>Loading...</div>}>
              <Terms />
            </Suspense>
          </Route>
          <Route path="/imprint">
            <Suspense fallback={<div>Loading...</div>}>
              <Imprint />
            </Suspense>
          </Route>
          <Route path="/compatibility">
            <Suspense fallback={<div>Loading...</div>}>
              <Compatibility />
            </Suspense>
          </Route>
          <Route path="/">
            <Suspense fallback={<div>Loading...</div>}>
              <Home transfer={transfer} />
            </Suspense>
          </Route>
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default withRouter(Routes);
