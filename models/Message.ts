import { Schema, model, models } from 'mongoose';
const MessageSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
  text: String
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.Message || model('Message', MessageSchema);
