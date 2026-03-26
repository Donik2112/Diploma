import { Schema, model, models } from 'mongoose';
const ApplicationSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  coverLetter: String,
  proposedPrice: Number,
  estimatedDuration: String,
  status: { type: String, enum: ['SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'], default: 'SENT' }
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.Application || model('Application', ApplicationSchema);
