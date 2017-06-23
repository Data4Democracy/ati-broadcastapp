// test posting

import mongoose from 'mongoose';
import request from 'request-promise-native';

import db from '../models/db';

const groups = ['1025537044214027', '1318937518226597'];

// main
(async () => {
  await db();

  const fbResponse = await request({
      url: 'https://graph.facebook.com/oauth/access_token',
      qs: {
        grant_type: 'fb_exchange_token',
        client_id: credentialsClient.fbAppId,
        client_secret: credentials.fbAppSecretId,
        fb_exchange_token: req.body.accessToken,
      },
      json: true,
    });
  
  await mongoose.disconnect();
})();
