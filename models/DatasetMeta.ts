import { Schema, model, models } from 'mongoose';

const DatasetMetaSchema = new Schema({}, { strict: false, collection: 'datasetMeta', timestamps: true });

export default models.DatasetMeta || model('DatasetMeta', DatasetMetaSchema);
