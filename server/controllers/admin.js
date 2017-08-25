// Controller for admin-related API functionality

//  We don't need a default export for this file
/* eslint-disable import/prefer-default-export */

import mongoose from 'mongoose';
import request from 'request-promise-native';

import { jsonRespond, makeError } from '../_common/express-helpers';
import getConfigPromise from '../config';
import credentialsClient from '../credentials-client';

//  Adminsetting can only be defined after the mongoose schema have been
//  defined. There might be a better way to handle this.
let Adminsetting = null;

//  Update the Facebook Access Token
//  Expect a JSON object with parameters
//   userId (string): the userId of the user attempting to log in
//   accessToken (string): the access token sent in
//  If userId is not that of the broadcast user, will return an error 403,
//  with error.errors = [{reason: 'WrongUser'}]

export async function updateAccessTokenMain(
  { body: { userId, accessToken } }) {
  if (!Adminsetting) {
    Adminsetting = mongoose.model('Adminsetting');
  }

  const config = await getConfigPromise();

  if (!(userId === config.get('fb_broadcastuserid'))) {
    return makeError({
      code: 400,
      message: 'Wrong Facebook user',
      reason: 'WrongUser',
    });
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
      code: 500,
      message: `Error in Facebook response to token request: ${err.message}`,
    });
  }

  if (!(fbResponse.access_token && fbResponse.expires_in)) {
    return makeError({
      code: 500,
      message: 'access_token or expires_in not found in FaceBook response',
    });
  }

  const expiryDate = new Date(Date.now() + (fbResponse.expires_in * 1000));

  try {
    await Adminsetting.update(
      { name: 'accessToken' },
      { name: 'accessToken', token: fbResponse.access_token, expiryDate },
      { upsert: true });
  } catch (err) {
    return makeError({
      code: 500,
      message: `Error updating token in DB: ${err.message}`,
    });
  }

  return { data: expiryDate };
}

//  Otherwise, returns a successful query, where data is the expiryDate
//   (Date), i.e. when the access token expires
export async function updateAccessToken(req, res, next) {
  await jsonRespond(res, await updateAccessTokenMain(req));
}
