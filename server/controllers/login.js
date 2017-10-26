// Controller for admin-related API functionality

import mongoose from 'mongoose';

import { middlewareFactory } from '../_common/express-helpers';
import authUserGoogle from './authUserGoogle';

//  to abstract the token validation (in case we want to change later to,
//    e.g. Facebook login), validation is done by the asynchronous
//    authToken function.
//  authToken accepts 2 arguments:
//      authToken(idToken, isProduction).
//    @param idToken string is the ID token to use to login.
//    @param isProduction boolean specifies whether the current environment
//      is production or not, which, e.g. affects how verbose error
//      messages are

//  On success: returns a user mongoose object
//  On failure: returns a json object to be sent to the user, as would be
//    created, e.g. by makeError.
//    These are common reasons for the error objects:
//      CouldNotVerifyToken: the token could not authenticated
//      NoUser: the user is not registered
const authUser = authUserGoogle;

let User = null;

//  initialize variables
function init() {
  if (!User) {
    User = mongoose.model('User');
  }
}

//  loginGetMain, loginPostMain have a common response. This makes it from
//  USER. It assumes USER is a non-null mongo object.
function makeLoginResponse(user) {
  const { states, firstName, lastName } = user;
  return { data: { isLoggedIn: true, states, firstName, lastName } };
}

//  Get current login state
export async function loginGetMain({ session }) {
  init();

  if (session.userId) {
    const user = await User.findOne({ _id: session.userId });
    if (user) {
      return makeLoginResponse(user);
    } else {
      session.userId = null;
    }
  }
  return { data: { isLoggedIn: false } };
}

//  attempt to log in user using idToken
//  session should have a userIdAuth property
export async function loginPostMain(
  { body: { idToken }, session, app: { locals: { isProduction } } }) {
  init();

  //  we use locals.user as a state variable, so make sure it's null at
  //  first. also, if user tries to login in as someone else and fails,
  //  this deletes any initial login
  session.userId = null;
  const userOrError = await authUser(idToken, isProduction);
  if (userOrError instanceof User) {
    session.userId = userOrError.id;
    return makeLoginResponse(userOrError);
  } else {
    return userOrError;
  }
}

export async function loginDeleteMain({ session }) {
  session.destroy();
  return {};
}

export default {
  loginGet: middlewareFactory(loginGetMain),
  loginPost: middlewareFactory(loginPostMain),
  loginDelete: middlewareFactory(loginDeleteMain),
};
