import mongoose from 'mongoose';
import Bundle from '../models/Bundle';
import Vacancy from '../models/Vacancy';
import ImportedProject from '../models/ImportedProject';
import VacancyCard from '../models/VacancyCard';
import DatasetMeta from '../models/DatasetMeta';

async function migrateBundleToCollections() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Set MONGODB_URI (or MONGO_URI) before running migration.');
  }

  await mongoose.connect(mongoUri);

  const bundleRaw = await Bundle.findOne({}).lean();
  const bundle = Array.isArray(bundleRaw) ? bundleRaw[0] : bundleRaw;

  if (!bundle) {
    console.log('No bundle found in "bundles" collection.');
    await mongoose.disconnect();
    return;
  }

  const vacancies = Array.isArray((bundle as any).vacancies) ? (bundle as any).vacancies : [];
  const projects = Array.isArray((bundle as any).projects) ? (bundle as any).projects : [];
  const vacancyCards = Array.isArray((bundle as any).vacancy_cards) ? (bundle as any).vacancy_cards : [];
  const meta = (bundle as any).meta || null;

  if (vacancies.length) {
    await Vacancy.deleteMany({});
    await Vacancy.insertMany(vacancies, { ordered: false });
  }

  if (projects.length) {
    await ImportedProject.deleteMany({});
    await ImportedProject.insertMany(projects, { ordered: false });
  }

  if (vacancyCards.length) {
    await VacancyCard.deleteMany({});
    await VacancyCard.insertMany(vacancyCards, { ordered: false });
  }

  if (meta) {
    await DatasetMeta.deleteMany({});
    await DatasetMeta.create(meta);
  }

  console.log('Migration completed successfully.');
  console.log(`Vacancies: ${vacancies.length}, Projects: ${projects.length}, VacancyCards: ${vacancyCards.length}, Meta: ${meta ? 1 : 0}`);

  await mongoose.disconnect();
}

migrateBundleToCollections().catch(async (error) => {
  console.error('Migration failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
