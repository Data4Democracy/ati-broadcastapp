#!/usr/bin/env node

import yargs from 'yargs';

import addUser from '../dist-server/_common/addUser';
import { allStates } from '../dist-server/_common/states';

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
    states: allStates,
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
