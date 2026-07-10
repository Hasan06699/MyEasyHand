import 'dotenv/config';
import mongoose from 'mongoose';
import { seedCities } from '../src/database/seeders/seed-cities';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myeasyhand';
  await mongoose.connect(uri);
  const docs = await seedCities();
  console.log('Seeded cities:', docs.map((d) => d.name).join(', '));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
