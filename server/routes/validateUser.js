//  user validation goes here

//  this is run before any api functions except login

import mongoose from 'mongoose';

import sendError from '../_common/express-helpers';

let User;

export default async function validateUser(req, res, next) {
  if (!User) {
    User = mongoose.model('User');
  }

  // presumably, we actually pull up the user from a cookie somehow
  req.atiba.user = User.testUser;

  // validation code here
  let userValidFl = true; // eslint-disable-line prefer-const

  if (!userValidFl) {
    sendError(res, {
      code: 403,
      reason: 'InvalidCredentials',
      message: 'Request does not have appropriate credentials.',
    });
    return;
  }

  next();
}

