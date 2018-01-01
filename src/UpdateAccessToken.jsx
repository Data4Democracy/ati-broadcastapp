// FB defined in Facebook script
/* global FB */

import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

import { postParseJson, printBackendError } from './common-client';
import credentials from './credentials-client.js';

const FBStateEnum = Object.freeze({
  unknown: 0,        //  unknown or not connected
  wrongUser: 1,      //  logged in as wrong user
  waiting: 2,        //  waiting, likely for server response
  error: 3,    //  server error
  success: 4,        //  token successfully generated and/or extended
});

export default class GetAccessToken extends React.Component {
  constructor(props) {
    super(props);

    /* eslint-disable */
    //////////////////////////////////////////////////////////////////////
    // BEGIN Facebook setup script

    window.fbAsyncInit = function() {
      FB.init({
        appId      : credentials.fbAppId,
        cookie     : true,
        xfbml      : true,
        version    : 'v2.9'
      });
      FB.AppEvents.logPageView();   
    };

    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    
    // END Facebook login script
    //////////////////////////////////////////////////////////////////////
    /* eslint-enable */

    this.fbLogin = this.fbLogin.bind(this);

    this.state = {
      fbState: FBStateEnum.unknown,  //  FaceBook login state
      expiryDate: null,              //  expiration date of token
      err: null,                     //  server error
    };
  }

  // Attempt to log into facebook after login button pressed
  async fbLogin() {
    this.setState({ fbState: FBStateEnum.waiting });

    let fbResponse;
    try {
      fbResponse = await new Promise(
        (resolve, reject) =>
          FB.login(
            response => resolve(response),
            { scope: 'publish_actions,user_managed_groups' }));
    } catch (e) {
      this.setState({
        fbState: FBStateEnum.error,
        err: `Error connecting to Facebook: ${e.toString()}`,
      });
      return;
    }

    if (fbResponse.status !== 'connected') {
      this.setState({
        fbState: FBStateEnum.error,
        err: `Error logging into Facebook: ${fbResponse.toString()}`,
      });
      return;
    }

    //  Get the response and parse it as json
    let response;
    try {
      response = await postParseJson(
        '/api/admin/update-access-token',
        { userIdOt: fbResponse.authResponse.userID,
          accessToken: fbResponse.authResponse.accessToken });
    } catch (e) {
      this.setState({
        fbState: FBStateEnum.error,
        err: `Error getting response from server: ${e.toString()}`,
      });
      return;
    }

    if (response.error) {
      if (response.error.code === 400
          && response.error.errors
          && response.error.errors.filter(
            err => err.reason === 'WrongUser')) {
        this.setState({ fbState: FBStateEnum.wrongUser });
      } else {
        this.setState({
          fbState: FBStateEnum.error,
          err: printBackendError(response, true),
        });
      }
      return;
    }

    this.setState({
      fbState: FBStateEnum.success,
      expiryDate: response.data,
    });
  }

  render() {
    let content;
    switch (this.state.fbState) {
      case FBStateEnum.unknown:
        content = (
          <div>
            <button onClick={this.fbLogin}>Login</button>
          </div>
        );
        break;
      case FBStateEnum.wrongUser:
        content = (
          <div>Please log into FaceBook with correct user.</div>
        );
        break;
      case FBStateEnum.waiting:
        content = (
          <div>Please wait for response.</div>
        );
        break;
      case FBStateEnum.error:
        content = (
          <div>
            <div>Server Error: {this.state.err}</div>
            <div>Retry login?</div>
            <button onClick={this.fbLogin}>Login</button>
          </div>
        );
        break;
      case FBStateEnum.success:
        content = (
          <div>Token updated through {
            moment(this.state.expiryDate).format('MM/DD/YY')}.
          </div>
        );
        break;
      default:
        throw new Error('Should not reach here');
    }

    return (
      <div>
        {content}
        <Link to="/">Back to home</Link>
      </div>
    );
  }
}
