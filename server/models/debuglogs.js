// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

//  Create the Broadcasts options model.
//   See the TECHNICAL readme for the allowed options.
export default function () {
  const { Mixed, ObjectId } = mongoose.Schema.Types;

  const debuglogSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    user: { type: ObjectId, required: true },
    request: { type: Mixed, required: true },
    response: { type: Mixed, required: false },
    error: { type: Mixed, required: false },
    type: { type: String, required: true },
    address: { type: Mixed, required: false },
  });

  mongoose.model('Debuglog', debuglogSchema);
}
