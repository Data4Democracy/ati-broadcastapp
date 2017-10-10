//  we abstract the login button component in case we need to change login
//  providers

import React from 'react';
import PropTypes from 'prop-types';

import { injectScript } from './common-client';

//  LoginButton takes three properties: appId, onSuccess onFailure.
//  The latter two are callbacks used in the appropriate instances.
//
//  ONSUCCESS is called with the appropriate ID token.
//  ONFAILURE is called with an error
class GoogleLoginButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //  have we begun styling the button?
      isStyled: false,
    };
  }

  //  style the login button
  async styleButton() {
    if (!window.gapi) {
      await injectScript('https://apis.google.com/js/api.js');
    }
    if (!window.gapi.signin2) {
      await new Promise(
        (resolveInner, rejectInner) => window.gapi.load('signin2', {
          callback: resolveInner,
          onerror: () =>
            rejectInner(new Error('gapi.signin2 failed to load')),
          timeout: 5000,
          ontimeout: () =>
            rejectInner(new Error('gapi.signin2 timed-out on load ')),
        }));
    }

    window.gapi.signin2.render('g-signin2', {
      id: 'g-signin2',
      onsuccess: (googleUser) => {
        this.props.onSuccess(googleUser.getAuthResponse().id_token);
      },
      onfailure: this.props.onFailure,
      scope: 'email',
    });
  }

  render(props) {
    if (!this.state.isStyled) {
      this.state.isStyled = true;

      this.styleButton();

      // add a header with client id if not already present
      if (!document.querySelector('meta[name="google-signin-client_id"]')) {
        const meta = document.createElement('meta');
        meta.name = 'google-signin-client_id';
        meta.content = this.props.appId;
        document.head.appendChild(meta);
      }
    }
    return <div id="g-signin2" />;
  }
}

GoogleLoginButton.propTypes = {
  appId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
};

GoogleLoginButton.defaultProps = {
  onSuccess: () => {},
  onFailure: () => {},
};

export default GoogleLoginButton;
