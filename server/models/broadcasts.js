// Broadcasts holds the record of broadcasted messages

import mongoose from 'mongoose';

//  Create the Broadcasts model
//   See the TECHNICAL readme for the allowed options.
export default async function makeBroadcasts() {
  const { Mixed, ObjectId } = mongoose.Schema.Types;

  const messageStateSchema = new mongoose.Schema({
    message: { type: String, required: true },
  });

  const broadcastOperationSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    userId: { type: ObjectId, required: true },
    messageStateId: { type: ObjectId, required: true },
    retryFl: { type: Boolean, required: true },
    //  in principle, there should be no broadcastOperation's without
    //  debuglogIds, but in practice, the broadcastOperation is generated
    //  first
    debuglogIds: { type: [ObjectId], required: false },
    response: { type: Mixed, required: false },
  }, { strict: 'throw' });

  const broadcastSchema = new mongoose.Schema({
    state: { type: String, required: true, index: true },
    messageStates: { type: [messageStateSchema], required: true },
    groupStatus: { type: Mixed, required: true },
    broadcastOperations: { type: [broadcastOperationSchema], required: true },
    editedState: { type: Date, required: false },
    fbProfStatuses: { type: Mixed, required: false },
  }, { strict: 'throw' });

  //  asynchronously make a new broadcast, returning the broadcast as a
  //  promise
  //  it is assumed the broadcast will immediately be acted upon so that
  //  editedState will be set
  broadcastSchema.statics.newBroadcast
  //  (cannot be an arrow function because we need to bind this)
    = async function newBroadcast(user, state, message) {
      const date = new Date();
      const broadcast = new this({
        state,
        messageStates: [{ message }],
        groupStatus: {},
        broadcastOperations: [],
        editedState: date,
      });
      broadcast.broadcastOperations.push({
        date,
        userId: user,
        messageStateId: broadcast.messageStates[0],
        retryFl: false,
        debuglogIds: [],
      });
      return broadcast.save();
    };

  const model = mongoose.model('Broadcast', broadcastSchema);
  await model.ensureIndexes();
}
