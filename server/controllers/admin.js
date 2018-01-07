// Controller for admin-related API functionality

import mongoose from 'mongoose';
import request from 'request-promise-native';

import { makeError, middlewareFactory } from '../_common/express-helpers';
import getConfigPromise from '../config';
import credentialsClient from '../credentials-client';

//  Adminsetting can only be defined after the mongoose schema have been
//  defined. There might be a better way to handle this.
let Adminsetting = null;

//  Update the Facebook Access Token
//  Expect a JSON object with parameters
//   userIdOt (string): the facebook user-ID of the user attempting to log in
//   accessToken (string): the access token sent in
//  If userIdOt is not that of the broadcast user, will return an error 403,
//  with error.errors = [{reason: 'WrongUser'}]
export async function updateAccessTokenMain(
  { body: { userIdOt, accessToken } }) {
  if (!Adminsetting) {
    Adminsetting = mongoose.model('Adminsetting');
  }

  const config = await getConfigPromise();

  if (!(userIdOt === config.get('fb_broadcastuserid'))) {
    return makeError({
      message: 'Wrong Facebook user',
      reason: 'WrongUser',
    }, 400);
  }

  let fbResponse;
  try {
    //  Response will look like
    //  { "access_token":ACCESS_TOKEN,
    //    "token_type":"bearer",
    //    "expires_in":5183999}
    fbResponse = await request({
      url: 'https://graph.facebook.com/oauth/access_token',
      qs: {
        grant_type: 'fb_exchange_token',
        client_id: credentialsClient.fbAppId,
        client_secret: config.get('fb_appsecretid'),
        fb_exchange_token: accessToken,
      },
      json: true,
    });
  } catch (err) {
    return makeError({
      message: `Error in Facebook response to token request: ${err.message}`,
    }, 500);
  }

  if (!(fbResponse.access_token && fbResponse.expires_in)) {
    return makeError({
      message: 'access_token or expires_in not found in FaceBook response',
    }, 500);
  }

  const expiryDate = new Date(Date.now() + (fbResponse.expires_in * 1000));

  try {
    await Adminsetting.update(
      { name: 'accessToken' },
      { name: 'accessToken', token: fbResponse.access_token, expiryDate },
      { upsert: true });
  } catch (err) {
    return makeError({
      message: `Error updating token in DB: ${err.message}`,
    }, 500);
  }

  return { data: expiryDate };
}

export default {
  updateAccessToken: middlewareFactory(updateAccessTokenMain),
};
