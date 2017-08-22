// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

export const testUser = {
  firstName: 'Test',
  lastName: 'User',
  // eslint-disable-next-line max-len
  states: ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MH', 'MA', 'MI', 'FM', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'VI', 'WA', 'WV', 'WI', 'WY'],
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
