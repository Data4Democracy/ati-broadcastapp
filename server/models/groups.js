// Groups hold information about groups

import crypto from 'crypto';
import mongoose from 'mongoose';

import { deepCopyRep } from '../_common/misc';
import { asObjectId } from '../_common/mongooseHelpers';

const { ObjectId, Mixed } = mongoose.Schema.Types;

//  Create the user model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeGroup() {
  const groupSchema = new mongoose.Schema({
    name: { type: String, required: false },
    state: { type: String, required: false, index: true },
    fbProfId: {
      type: ObjectId, required: false, sparse: true },
    fbProfFailReason: {
      type: {
        reason: { type: String, required: true },
        ref: { type: Mixed, required: true } },
      required: false,
      index: true,
      sparse: true,
      //  this is partly to make sure we use proper format here and partly
      //  to properly format when saving
      set: (failReason) => {
        const { reason, ref } = failReason;
        /* eslint-disable prefer-template */
        switch (reason) {
          case 'FbProfDuplicate':
          case 'BadFbUrl': {
            const refAsObjectId = asObjectId(ref);
            if (!refAsObjectId) {
              throw new Error(
                'For fbProfFailReason, if reason is'
                  + ' FbProfDuplicate or BadFbUrl,'
                  + ' then ref must be a mongoose object or objectid: '
                  + ref);
            }
            return {
              reason,
              ref: refAsObjectId,
            };
          }
          case 'FacebookQueryFailed':
            if (!(ref && ref.reason)) {
              throw new Error(
                'For fbProfFailReason,'
                  + ' ref has wrong form for reason FacebookQueryFailed: '
                  + ref);
            }
            return { reason, ref: deepCopyRep(ref) };
          default:
            throw new Error(
              'Unknown reason given for fbProfFailReason: ' + reason);
        }
        /* eslint-enable prefer-template */
      },
    },
    lat: { type: String, required: false },
    lng: { type: String, required: false },
    fbUrl: { type: String, required: false },
    twitter: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false },
    venue: { type: String, required: false },
    urlOt: { type: String, required: false },
  }, { strict: 'throw' });

  groupSchema.statics.hashGroupsRaw = function hashGroupsRaw(downloadedJson) {
    const hash = crypto.createHash('sha1');
    hash.update(downloadedJson);
    return hash.digest('latin1');
  };

  const modelGroup = mongoose.model('Group', groupSchema);
  const modelGroupTemp = mongoose.model('GroupTemp', groupSchema);
  await Promise.all([
    modelGroup.ensureIndexes(),
    modelGroupTemp.ensureIndexes(),
  ]);
}
