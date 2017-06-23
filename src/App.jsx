import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Link }
from 'react-router-dom';
import 'whatwg-fetch';  //  fetch polyfill, as needed

import Header from './Header.jsx';
import SomeClass from './SomeClass.jsx';
import UpdateAccessToken from './UpdateAccessToken.jsx';

const contentNode = document.getElementById('contents');
const NoMatch = () => <p>Page Not Found</p>;

const Home = () => (
  <div>
    <h2>Home</h2>
    <h3><Link to="/update-access-token">Update Access Token</Link></h3>
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
          <Route path="/update-access-token" component={UpdateAccessToken} />
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
