//  holds a list of bad facebook URL's

import mongoose from 'mongoose';

//  Create the user model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeBadFbUrl() {
  const badFbUrlSchema = new mongoose.Schema({
    fbUrl: { type: String, required: true, unique: true },
    reason: {
      type: String,
      required: true,
      index: true,
      enum: ['BadFacebookResponse', 'UrlParseFailed'],
    },
    response: { type: mongoose.Schema.Types.Mixed, required: false },
  }, { strict: 'throw' });

  const model = mongoose.model('BadFbUrl', badFbUrlSchema);
  await model.ensureIndexes();
}
