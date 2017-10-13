import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Link }
  from 'react-router-dom';
import 'whatwg-fetch'; //  fetch polyfill, as needed

import Login from './Login.jsx';
import LogOut from './LogOut.jsx';
import Header from './Header.jsx';
import UpdateAccessToken from './UpdateAccessToken.jsx';

const contentNode = document.getElementById('contents');
const NoMatch = () => <p>Page Not Found</p>;

const Home = () => (
  <div>
    <h2>Home</h2>
    <h3><Link to="/update-access-token">Update Access Token</Link></h3>
  </div>
);

class AppMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //  if null, the user is not logged in
      //  when logged in, the user is an object
      //  { states, firstName, lastName, isAdmin }
      user: null,
    };
    this.setUser = this.setUser.bind(this);
  }

  //  set the user's login state
  setUser(user) {
    this.setState({ user });
  }

  render() {
    if (!this.state.user) {
      return <Login setUser={this.setUser} />;
    }

    return (
      <Router>
        <div>
          <Header user={this.state.user} />
          <div className="container-fluid">
            <Switch>
              <Route exact path="/" component={Home} />
              <Route
                exact
                path="/logout"
                render={props => (
                  <LogOut
                    setUser={this.setUser}
                    history={props.history}
                  />)}
              />
              <Route
                path="/update-access-token"
                component={UpdateAccessToken}
              />
              <Route path="*" component={NoMatch} />
            </Switch>
            <hr />
            <h5><small>Some footer text.</small></h5>
          </div>
        </div>
      </Router>);
  }
}

// wrapper that includes logout functionality
const AppWrapper = props => (
  <Router>
    <Switch>
      <Route exact path="/logout" component={LogOut} />
      <Route component={AppMain} />
    </Switch>
  </Router>
);

ReactDOM.render(<AppWrapper />, contentNode);

if (module.hot) {
  module.hot.accept();
}
