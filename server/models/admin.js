// The Admin collection holds admin settings

import mongoose from 'mongoose';

//  Create the Admin options model.
//   See the TECHNICAL readme for the allowed options.
export default function () {
  const Mixed = mongoose.Schema.Types.Mixed;

  const adminSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    value: { type: Mixed, required: true },
  });

  mongoose.model('Admin', adminSchema);
}