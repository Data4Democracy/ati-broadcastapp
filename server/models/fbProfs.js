// FbProfs hold information about Facebook profiles
// (In Facebook parlance, a "profile" can be a page or a group.)

import mongoose from 'mongoose';

import { toObject } from '../_common/misc';

const debugName = 'debugging-profile';
/**
 * array of debugging IdOt's
 */
const debugIdOts = [
  '1025537044214027', // '1318937518226597', '461816757311012',
];

//  Create the user model.
export default async function makeFbProf() {
  // not that the sparse property of the index for urlAliases doesn't
  // actually do anything because, if urlAliases is not given, mongoose
  // will save [] in the field; this can be allegedly be changed by using
  // the "default" field
  const fbProfSchema = new mongoose.Schema({
    idOt: { type: String, required: false, unique: true },
    name: { type: String, required: false, index: true, sparse: true },
    type: { type: String, required: false },
    isCertain: { type: Boolean, required: true },
    urlAliases: {
      type: [String], required: false, unique: true, sparse: true },
  }, { strict: 'throw' });

  /**
   * format an fbProf to be sent in a response
   */
  fbProfSchema.methods.forResponse = function forResponse() {
    return toObject(['id', 'idOt', 'name'], key => this.get(key));
  };

  const model = mongoose.model('FbProf', fbProfSchema);
  await model.ensureIndexes();

  // make debugging profiles
  model.debugFbProfs = await Promise.all(debugIdOts.map(
    idOt => (
      model.findOneAndUpdate(
        { idOt },
        { idOt, name: debugName }
        , { upsert: true, new: true })
    ),
  ));
}
