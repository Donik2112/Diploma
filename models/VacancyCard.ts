import { Schema, model, models } from 'mongoose';

const VacancyCardSchema = new Schema({}, { strict: false, collection: 'vacancyCards', timestamps: true });

export default models.VacancyCard || model('VacancyCard', VacancyCardSchema);
