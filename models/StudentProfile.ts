import { Schema, model, models } from 'mongoose';
const StudentProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  skills: [String],
  experienceLevel: String,
  portfolioLinks: [String],
  certificates: [String],
  interests: [String],
  githubUrl: String,
  linkedinUrl: String,
  resumeText: String,
  about: String,
  availabilityStatus: String,
  savedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });
export default models.StudentProfile || model('StudentProfile', StudentProfileSchema);
