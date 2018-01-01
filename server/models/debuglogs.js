// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

import { validIpP } from '../_common/misc';

//  Create the Broadcasts options model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeDebuglogs() {
  const { Mixed, ObjectId } = mongoose.Schema.Types;

  const debuglogSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    userId: { type: ObjectId, required: true },
    ip: { type: String, required: true, validate: { validator: validIpP } },
    request: { type: Mixed, required: true },
    response: { type: Mixed, required: false },
    error: { type: Mixed, required: false },
    type: { type: String, required: true },
    address: { type: Mixed, required: false },
  }, { strict: 'throw' });

  const model = mongoose.model('Debuglog', debuglogSchema);
  await model.ensureIndexes();
}
