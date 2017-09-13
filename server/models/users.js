// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

export const testUser = {
  firstName: 'Test',
  lastName: 'User',
  // eslint-disable-next-line max-len
  states: ['al', 'ak', 'as', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl', 'ga', 'gu', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'mh', 'ma', 'mi', 'fm', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'mp', 'oh', 'ok', 'or', 'pw', 'pa', 'pr', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'vi', 'wa', 'wv', 'wi', 'wy'],
  loginEmail: 'test-user@example.com',
};

//  Create the user model.
//   See the TECHNICAL readme for the allowed options.
export default function makeUser() {
  const usersSchema = new mongoose.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: true },
    states: { type: [String], required: false },
    loginEmail: { type: String, required: true, unique: true },
    contactEmail: { type: String, required: false, index: true },
  });

  usersSchema.statics.addTestUser = async function addTestUser() {
    let testUserObj = await this.findOne({ loginEmail: testUser.loginEmail });
    if (!testUserObj) {
      testUserObj = new this(testUser);
      await testUserObj.save();
    }
    // add testUser as a property on the Users model
    this.testUser = testUserObj;
  };

  mongoose.model('User', usersSchema);

  // add a test user if we don't have one already
}
