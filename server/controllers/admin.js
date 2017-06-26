// Controller for admin-related API functionality

//  We don't need a default export for this file
/* eslint-disable import/prefer-default-export */

import mongoose from 'mongoose';
import request from 'request-promise-native';

import sendError from '../_common/sendError';
import getConfigPromise from '../config';
import credentialsClient from '../credentials-client';

//  AdminModel can only be defined after the mongoose schema have been
//  defined. There might be a better way to handle this.
let AdminModel = null;

//  Update the Facebook Access Token
//  Expect a JSON object with parameters
//   userId (string): the userId of the user attempting to log in
//   accessToken (string): the access token sent in
//  If userId is not that of the broadcast user, will return an error 403,
//  with error.errors = [{reason: 'WrongUser'}]
//
//  Otherwise, returns a successful query, where data is the expiryDate
//   (Date), i.e. when the access token expires
export async function updateAccessToken(req, res, next) {
  if (!AdminModel) {
    AdminModel = mongoose.model('Admin');
  }

  const config = await getConfigPromise();

  if (!(req.body.userId === config.get('fb_broadcastuserid'))) {
    sendError(res, {
      code: 403,
      message: 'Wrong Facebook user',
      errors: [{ reason: 'WrongUser' }],
    });
    return;
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
        fb_exchange_token: req.body.accessToken,
      },
      json: true,
    });
  } catch (err) {
    sendError(res, {
      code: 500,
      message: `Error in Facebook response to token request: ${err.message}`,
    });
    return;
  }

  if (!(fbResponse.access_token && fbResponse.expires_in)) {
    sendError(res, {
      code: 500,
      message: 'access_token or expires_in not found in FaceBook response',
    });
    return;
  }

  const expiryDate = new Date(Date.now() + (fbResponse.expires_in * 1000));

  try {
    await AdminModel.update(
      { name: 'accessToken' },
      { name: 'accessToken', token: fbResponse.access_token, expiryDate },
      { upsert: true });
  } catch (err) {
    sendError(res, {
      code: 500,
      message: `Error updating token in DB: ${err.message}`,
    });
    return;
  }

  res.status(200).json({ data: expiryDate });
}
