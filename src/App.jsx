import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import Header from './Header.jsx';
import SomeClass from './SomeClass.jsx';

const contentNode = document.getElementById('contents');
const NoMatch = () => <p>Page Not Found</p>;

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
);

const App = () => (
  <Router>
    <div>
      <Header />
      <div className="container-fluid">
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/some-path" component={SomeClass} />
          <Route path="*" component={NoMatch} />
        </Switch>
        <hr />
        <h5><small>Some footer text.</small></h5>
      </div>
    </div>
  </Router>
);

ReactDOM.render(<App />, contentNode);

if (module.hot) {
  module.hot.accept();
}
