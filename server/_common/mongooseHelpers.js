/**
 * helpers for mongoose
 */

import mongoose from 'mongoose';

/**
 * returns an ObjectId from the input, converting it from a model if
 * necessary. if the input is neither a model or object id, return
 * undefined
 */
export function asObjectId(modelOrObjectId) {
  if (modelOrObjectId instanceof mongoose.Types.ObjectId) {
    return modelOrObjectId;
  } else if (modelOrObjectId instanceof mongoose.Model) {
    return modelOrObjectId._id;
  } else {
    return undefined;
  }
}
