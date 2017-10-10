import React from 'react';
import PropTypes from 'prop-types';

import { getParseJson, postParseJson, printBackendError }
  from './common-client';
import GoogleLoginButton from './GoogleLoginButton.jsx';
import googleLogOut from './googleLogOut';
import clientCredentials from './credentials-client';

const LoginButton = GoogleLoginButton;
const logOut = googleLogOut;

//  /login GET and POST return the same response format.
//  This transforms such a response into a user object as expected by
//  setUser.
function getUserFromLogin(response) {
  const { states, firstName, lastName } = response.data;
  return { states, firstName, lastName };
}

export default class LogIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //  are we waiting for a remote response?
      waiting: true,
      //  any error messages to show
      error: null,
    };

    this.onAuthFailure = this.onAuthFailure.bind(this);
    this.onAuthSuccess = this.onAuthSuccess.bind(this);

    // are we already logged in?
    getParseJson('/api/login').then(
      // on success
      (response) => {
        if (response.data.isLoggedIn) {
          this.props.setUser(getUserFromLogin(response));
        } else {
          // if we aren't logged in, we will need to set waiting to true
          this.setState({ waiting: false });
        }
      },
      // on error
      (error) => {
        this.setState({
          error: error.toString(),
          waiting: false,
        });
      },
    );
  }

  //  called when user successfully logs into authentication server
  //  called with the token returned
  async onAuthSuccess(idToken) {
    this.setState({
      error: null,
      waiting: true,
    });

    let response;
    let errorMsg = null;
    try {
      response = await postParseJson('/api/login', { idToken });
      if (response.error) {
        if (response.error.errors
            && response.error.errors[0].reason === 'NoUser') {
          //  we wrap in try...catch because a logOut error is not a big
          //  deal
          try {
            await logOut();
          } catch (e) {} // eslint-disable-line no-empty
        }
        errorMsg = printBackendError(response);
      }
    } catch (e) {
      errorMsg = e.toString();
    }

    this.setState({
      error: errorMsg,
      waiting: false,
    });

    if (errorMsg === null) {
      this.props.setUser(getUserFromLogin(response));
    }
  }

  onAuthFailure(error) {
    this.setState({
      error: 'Authorization failure. Please try to login again.',
    });
  }

  //  this is a hack because, as the Google login button is currently
  //  implemented, it fails if we remove it from and then restore it to the
  //  DOM. instead, we don't remove it and just make it invisible when not
  //  needed using this function
  //
  //  we use DOM attributes to change the style because React objects are
  //  generally immutable so they don't generally allow you to change the
  //  visibility of objects
  //  eslint-disable-next-line class-methods-use-this
  setLoginButtonVisibility(isVisible) {
    const elt = document.getElementById('login-button');
    if (elt) elt.style.visibility = (isVisible ? '' : 'hidden');
  }

  render() {
    if (this.state.waiting) {
      this.setLoginButtonVisibility(false);
      return (
        <div id="login-page" className="login-waiting">
          <h1>Waiting for server response</h1>
          {this.loginButton}
        </div>
      );
    } else {
      if (this.loginButton) {
        this.setLoginButtonVisibility(true);
      } else {
        this.loginButton = (
          // we give loginButton a key so it is not destroyed and recreated
          <div id="login-button" key="login-button">
            <LoginButton
              appId={clientCredentials.googleClientId}
              onSuccess={this.onAuthSuccess}
              onFailure={this.onAuthFailure}
            />
          </div>);
      }
      return (
        <div id="login-page" className="login-display">
          {this.state.error
          && <div className="login-error">{this.state.error}</div>}
          <div className="login-request-text">Please login</div>
          {this.loginButton}
        </div>
      );
    }
  }
}

LogIn.propTypes = {
  setUser: PropTypes.func.isRequired,
};
