import { Schema, model, models } from 'mongoose';

const ImportedProjectSchema = new Schema({}, { strict: false, collection: 'projects', timestamps: true });

export default models.ImportedProject || model('ImportedProject', ImportedProjectSchema);
