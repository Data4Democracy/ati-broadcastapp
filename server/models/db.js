//  database connectivity

import mongoose from 'mongoose';
import credentials from '../credentials.js';

function mongoConnect() {
  console.log('Mongoose attempting to connect');
  mongoose.connect(credentials.mongo.connectionString);
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

require('./someModel');
