//  database connectivity

import mongoose from 'mongoose';

import getConfigPromise from '../config';
import adminsettingsInit from './adminsettings';
import broadcastsInit from './broadcasts';
import usersInit from './users';
import debuglogInit from './debuglogs';

mongoose.Promise = global.Promise;

// opts. could be read, e.g. from environment
const opts = {};

//  Initialize the database
export default async function initDb() {
  // CONNECTION EVENTS
  mongoose.connection.on(
    'connecting', () => console.log('Mongoose connecting'));

  mongoose.connection.on('connected', () => console.log('Mongoose connected'));
  mongoose.connection.on(
    'error', err => console.log(`Mongoose connection error: ${err}`));

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
    // setInterval(mongoConnect, 200);
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

  adminsettingsInit();
  broadcastsInit();
  usersInit();
  debuglogInit();

  const config = await getConfigPromise();

  await mongoose.connect(config.get('mongo_connectionstring'), opts);

  await mongoose.model('User').addTestUser();
}
