// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';
import isemail from 'isemail';

import { allStates } from '../_common/states';

const utilUserDomain = 'util-user';


export const utilUsers = {
  debugUser: {
    lastName: 'debug',
    states: allStates,
    loginEmail: 'debug@' + utilUserDomain,
    isAdmin: true,
  },

  // user for cron jobs
  cronUser: {
    lastName: 'cron',
    states: [],
    loginEmail: 'cron@' + utilUserDomain,
    isAdmin: true,
  },
};

//  Create the user model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeUser() {
  const usersSchema = new mongoose.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: true },
    states: {
      type: [String],
      required: false,
      validate: {
        validator(states) {
          if (states instanceof Array) {
            for (const state of states) {
              if (allStates.indexOf(state) === -1) {
                return false;
              }
            }
            return true;
          } else {
            return false;
          }
        },
      },
    },
    authUserIdOt: {
      type: String, required: false, unique: true, sparse: true,
    },
    loginEmail: {
      type: String,
      required: true,
      index: true,
      unique: true,
      validate: { validator: isemail.validate },
    },
    contactEmail: { type: String, required: false, index: true },
    isAdmin: { type: Boolean, required: false, default: false },
  }, { strict: 'throw' });

  const model = mongoose.model('User', usersSchema);
  await model.ensureIndexes();

  // add util users
  await Promise.all(
    Object.keys(utilUsers).map(
      async (userName) => {
        const user = utilUsers[userName];
        let userObj = await model.findOne({
          loginEmail: user.loginEmail });
        if (!userObj) {
          userObj = await model.create(user);
        }
        // add user as a property on the Users model
        model[userName] = userObj;
      }),
  );
}
