//  This is a template for a model

import mongoose from 'mongoose';

const someSchema = new mongoose.Schema({
  someField: { type: String, required: true },
});

mongoose.model('Quiz', someSchema);
