// The Admin collection holds admin settings

import mongoose from 'mongoose';

//  Create the Admin options model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeAdminsettings() {
  const { Mixed } = mongoose.Schema.Types;

  const adminsettingSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    value: { type: Mixed, required: true },
  }, { strict: false });

  const model = mongoose.model('Adminsetting', adminsettingSchema);
  await model.ensureIndexes();
}
