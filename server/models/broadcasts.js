// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

//  Create the Broadcasts model
//   See the TECHNICAL readme for the allowed options.
export default function () {
  const { Mixed, ObjectId } = mongoose.Schema.Types;

  const messageStateSchema = new mongoose.Schema({
    message: { type: String, required: true },
  });

  const broadcastOperationSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    user: { type: ObjectId, required: true },
    messageState: { type: ObjectId, required: true },
    retryFl: { type: Boolean, required: true },
    //  in principle, there should be no broadcastOperation's without
    //  debuggingIds, but in practice, the broadcastOperation is generated
    //  first
    debugArr: { type: [ObjectId], required: false },
    response: { type: Mixed, require: false },
  });

  const broadcastSchema = new mongoose.Schema({
    state: { type: String, required: true, index: true },
    messageStates: { type: [messageStateSchema], required: true },
    groupStatus: { type: Mixed, required: true },
    broadcastOperations: { type: [broadcastOperationSchema], required: true },
    editStartTime: { type: Date, required: false },
  });

  //  asynchronously make a new broadcast, returning the broadcast as a
  //  promise
  //  it is assumed the broadcast will immediately be acted upon so that
  //  editStartTime will be set
  broadcastSchema.statics.newBroadcast
  //  (cannot be an arrow function because we need to bind this)
    = async function newBroadcast(user, state, message) {
      const date = new Date();
      const broadcast = new this({
        state,
        messageStates: [{ message }],
        groupStatus: {},
        broadcastOperations: [],
        editStartTime: date,
      });
      broadcast.broadcastOperations.push({
        date,
        user,
        messageState: broadcast.messageStates[0],
        retryFl: false,
        debugArr: [],
      });
      return broadcast.save();
    };

  mongoose.model('Broadcast', broadcastSchema);
}
