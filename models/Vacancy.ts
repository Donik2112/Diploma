import { Schema, model, models } from 'mongoose';

const VacancySchema = new Schema({}, { strict: false, collection: 'vacancies', timestamps: true });

export default models.Vacancy || model('Vacancy', VacancySchema);
