import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

import { fetchPostJson } from './common-client';
import credentials from './credentials-client.js';

// FB defined in Facebook script
/* global FB */

const FBStateEnum = Object.freeze({
  unknown: 0,        //  unknown or not connected
  wrongUser: 1,      //  logged in as wrong user
  waiting: 2,        //  waiting, likely for server response
  serverError: 3,    //  server error
  success: 4,        //  token successfully generated and/or extended
});

export default class GetAccessToken extends React.Component {

  constructor(props) {
    super(props);

    /*eslint-disable*/
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
    /*eslint-enable*/

    this.fbLogin = this.fbLogin.bind(this);

    this.state = {
      fbState: FBStateEnum.unknown,  //  FaceBook login state
      expiryDate: null,              //  expiration date of token
      err: null,                     //  server error
    };
  }

  // Attempt to log into facebook after login button pressed
  async fbLogin() {
    const response = await new Promise(
      (resolve, reject) =>
        FB.login(theResponse => resolve(theResponse),
                 { scope: 'publish_actions,user_managed_groups' }));

    //  note that fbLogin can only be called if status is not success, so
    //  we need not switch on that
    switch (response.status) { // eslint-disable-line default-case
      case 'not_authorized':
      case 'unknown':
        this.setState({ fbState: FBStateEnum.unknown });
        return;
      case 'connected': {
        this.setState({ fbState: FBStateEnum.waiting });
        const theResponseRaw = await fetchPostJson(
          '/api/admin/update-access-token',
          { userId: response.authResponse.userID,
            accessToken: response.authResponse.accessToken });
        //  Get the response and parse it as json
        const theResponse = await theResponseRaw.json();

        if (theResponseRaw.ok) {
          this.setState({
            fbState: FBStateEnum.success,
            expiryDate: theResponse.data,
          });
        } else {
          // eslint-disable-next-line no-lonely-if
          if (theResponse.error.code === 400
              && theResponse.error.errors
              && theResponse.error.errors.filter(
                err => err.reason === 'WrongUser')) {
            this.setState({ fbState: FBStateEnum.wrongUser });
          } else {
            this.setState({
              fbState: FBStateEnum.serverError,
              err: theResponse.error && theResponse.error.message
                ? theResponse.error.message : null });
          }
        }
      }
    }
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
      case FBStateEnum.serverError:
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
              moment(this.state.expiryDate).format('MM/DD/YY')}.</div>
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
