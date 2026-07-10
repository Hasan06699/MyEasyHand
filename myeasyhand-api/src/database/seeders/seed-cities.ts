import { City } from '../models/city.model';
import { Service } from '../models/service.model';
import { logger } from '../../common/utils/logger';

const CITIES = [
  { name: 'Indore', state: 'Madhya Pradesh', sortOrder: 1 },
  { name: 'Bhopal', state: 'Madhya Pradesh', sortOrder: 2 },
  { name: 'Ujjain', state: 'Madhya Pradesh', sortOrder: 3 },
  { name: 'Delhi', state: 'Delhi', sortOrder: 4 },
  { name: 'Mumbai', state: 'Maharashtra', sortOrder: 5 },
  { name: 'Jaipur', state: 'Rajasthan', sortOrder: 6 },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function seedCities() {
  const docs = [];
  for (const city of CITIES) {
    const doc = await City.findOneAndUpdate(
      { slug: slugify(city.name) },
      {
        name: city.name,
        slug: slugify(city.name),
        state: city.state,
        country: 'India',
        sortOrder: city.sortOrder,
        isActive: true,
        isDeleted: false,
      },
      { upsert: true, new: true },
    );
    docs.push(doc);
  }

  // Assign cities to services that have none (city-first catalog)
  const cityIds = docs.map((d) => d._id);
  const indore = docs.find((d) => d.slug === 'indore');
  const bhopal = docs.find((d) => d.slug === 'bhopal');
  const delhi = docs.find((d) => d.slug === 'delhi');

  const services = await Service.find({
    isDeleted: false,
    $or: [{ cityIds: { $exists: false } }, { cityIds: { $size: 0 } }],
  });

  let i = 0;
  for (const svc of services) {
    // Rotate cities so catalog isn't empty in any major city
    const pick = [indore, bhopal, delhi, indore].filter(Boolean);
    const assigned = pick.length ? [pick[i % pick.length]!._id] : cityIds.slice(0, 1);
    svc.cityIds = assigned as typeof svc.cityIds;
    await svc.save();
    i += 1;
  }

  logger.info(`[seed] cities: ${docs.length}, services assigned cityIds: ${services.length}`);
  return docs;
}
