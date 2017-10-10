//  the code for authenticating id tokens for google login
//  we place this in a separate file from login.js to abstract the login
//  logic because we might need to switch to facebook login later

//  if the login token is not verified, returns an error reason
//    CouldNotVerifyToken
//  if the user is not registered, return a reason NoUser

import util from 'util';
import GoogleAuth from 'google-auth-library';
import mongoose from 'mongoose';

import credentialsClient from '../credentials-client';
import { makeError }
  from '../_common/express-helpers';

let User;

const googleAuth = new GoogleAuth();

const client
      = new googleAuth.OAuth2(credentialsClient.googleClientId, '', '');

export default async function authUserGoogle(idToken, isProduction = true) {
  if (!User) {
    User = mongoose.model('User');
  }

  return new Promise((resolve, _) => {
    //  the only reference to the function verifyIdToken I could find is at
    //  https://developers.google.com/identity/sign-in/web/backend-auth
    client.verifyIdToken(
      idToken,
      credentialsClient.googleClientId,
      //  I assume e is for errors
      async (e, login) => {
        if (e) {
          const messageBase = 'Could not verify token';
          const messageFull = `${messageBase}: ${util.inspect(e)}`;
          console.error(messageFull);
          resolve(makeError({
            reason: 'CouldNotVerifyToken',
            message: isProduction ? messageBase : messageFull,
          }, 403));
        } else {
          const payload = login.getPayload();
          const localMakeError
                = message => (makeError({ reason: 'NoUser', message }, 403));

          /* eslint-disable dot-notation */
          let user = await User.findOne({ userIdAuth: payload['sub'] });
          if (user) {
            resolve(user);
            return;
          }

          // try to find user using e-mail
          if (!payload['email']) {
            resolve(
              localMakeError('Token does not contain user email address'));
            return;
          }

          if (!payload['email_verified']) {
            resolve(localMakeError('User email not verified'));
            return;
          }

          user = await User.findOne({ loginEmail: payload['email'] });
          if (!user) {
            resolve(localMakeError('Could not find user'));
            return;
          }

          user.userIdAuth = payload['sub'];
          resolve(user);
          /* eslint-enable dot-notation */
        }
      });
  });
}
