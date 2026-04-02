import { Schema, model, models } from 'mongoose';

const BundleSchema = new Schema({}, { strict: false, collection: 'bundles', timestamps: true });

export default models.Bundle || model('Bundle', BundleSchema);
