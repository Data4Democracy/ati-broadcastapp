#!/usr/bin/env node

const yargs = require('yargs');

const addUser = require('../dist/_common/addUser').default;
const users = require('../dist/models/users');

async function main() {
  const args = yargs
    .demandCommand(3, 3, 'You must have 3 commands.')
    .usage('addUser LOGINEMAIL FIRSTNAME LASTNAME')
    .version(false)
    .argv;

  const [loginEmail, firstName, lastName] = args._;

  await addUser({
    loginEmail,
    firstName,
    lastName,
    states: users.testUser.states,
    isAdmin: true,
  });

  console.log('User successfully added');
}

(async function mainWrapper() {
  try {
    await main();
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
