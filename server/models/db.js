//  database connectivity

import mongoose from 'mongoose';

import asyncConstant from '../_common/asyncConstant';
import getConfigPromise from '../config';
import adminsettingsModel from './adminsettings';
import broadcastsModel from './broadcasts';
import usersModel from './users';
import groupsModel from './groups';
import fbProfsModel from './fbProfs';
import badFbUrlsModel from './badFbUrls';
import cachedLocationsModel from './cachedLocations';
import debuglogModel from './debuglogs';

mongoose.Promise = global.Promise;

// opts. could be read, e.g. from environment
const opts = {};

//  Initialize the database. Return the mongoose connection
async function getDbPromise() {
  // CONNECTION EVENTS
  mongoose.connection.on(
    'connecting', () => console.log('Mongoose connecting'));

  mongoose.connection.on('connected', () => console.log('Mongoose connected'));
  mongoose.connection.on(
    'error', err => console.log(`Mongoose connection error: ${err}`));

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
  });

  // handle disconnects
  const disconnectWiMsg = (msg, callback) => {
    mongoose.connection.close(() => {
      console.log(`Mongoose disconnect due to ${msg}`);
      callback();
    });
  };

  // nodemon restarts
  process.once('SIGUSR2', () => {
    disconnectWiMsg(
      'nodemon restart', () => process.kill(process.pid, 'SIGUSR2'));
  });

  // app terminates
  process.on('SIGINT', () => {
    disconnectWiMsg('apt termination', () => process.exit(0));
  });

  // for Heroku app terminates
  process.on('SIGTERM', () => {
    disconnectWiMsg('Heroku apt termination', () => process.exit(0));
  });

  const config = await getConfigPromise();

  await mongoose.connect(
    config.get('mongo_connectionstring'),
    Object.assign(opts, { useMongoClient: true }));

  await Promise.all([
    adminsettingsModel(),
    broadcastsModel(),
    usersModel(),
    debuglogModel(),
    groupsModel(),
    fbProfsModel(),
    badFbUrlsModel(),
    cachedLocationsModel(),
  ]);

  return mongoose.connection;
}

export default asyncConstant(getDbPromise);
