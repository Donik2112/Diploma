import { Schema, model, models } from 'mongoose';
const StudentProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  city: String,
  university: String,
  bio: String,
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
  onboardingCompleted: { type: Boolean, default: false },
  preferredRoles: [String],
  preferredEmploymentTypes: [String],
  savedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });
export default models.StudentProfile || model('StudentProfile', StudentProfileSchema);
