//  database connectivity

import mongoose from 'mongoose';
import credentials from '../credentials';

import adminModels from './admin';

//  Initialize the database. An array of options can be passed in.
//  Options:
//    env (string):  can be 'development' or 'production'
export default function (opts) {
  function mongoConnect() {
    console.log('Mongoose attempting to connect');
    mongoose.connect(
      credentials.mongo.connectionString,
      { config: { autoIndex: opts !== 'production' } });
  }

  mongoConnect();

  // CONNECTION EVENTS
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

  adminModels();
}
