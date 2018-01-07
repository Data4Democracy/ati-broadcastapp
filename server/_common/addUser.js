//  this is used for adding users to the app

import SourceMapSupport from 'source-map-support';
import mongoose from 'mongoose';

import getDbConnection from '../models/db';

SourceMapSupport.install();

//  user can have
//   {firstName, lastName, states, loginEmail, authUserIdOt, isAdmin}
//  only lastName and loginEmail are required
export default async function addUser(user) {
  if (!(user.lastName && user.loginEmail)) {
    throw new Error('lastName and loginEmail are required');
  }

  const userToAdd = {};

  ['firstName', 'lastName', 'states',
    'loginEmail', 'authUserIdOt', 'isAdmin']
    .forEach((field) => {
      if (user[field]) userToAdd[field] = user[field];
    });

  await getDbConnection();

  const User = mongoose.model('User');

  let error;
  try {
    await User.create(userToAdd);
  } catch (e) {
    error = e;
  }

  await mongoose.disconnect();

  if (error) throw error;
}
