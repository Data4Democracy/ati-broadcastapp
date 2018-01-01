// CachedLocations hold information about cached locations of groups

import mongoose from 'mongoose';

//  Create the user model.
//   See the TECHNICAL readme for the allowed options.
export default async function makeCachedLocation() {
  const cachedLocationSchema = new mongoose.Schema({
    lat: { type: String, required: true },
    lng: { type: String, required: true },
    state: { type: String, required: true },
    source: { type: String, required: true, enum: ['arcgis', 'manual'] },
  }, { strict: 'throw' });

  cachedLocationSchema.index({ lat: 1, lng: 1 }, { unique: true });

  const model = mongoose.model('CachedLocation', cachedLocationSchema);
  await model.ensureIndexes();
}
