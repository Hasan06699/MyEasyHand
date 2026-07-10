import { ServiceCategory } from '../models/service-category.model';
import { CategorySeedNode, LEGACY_CATEGORY_SLUGS, MYEASYHAND_CATEGORY_TREE } from './category-tree.seed';
import { logger } from '../../common/utils/logger';

export async function migrateCategoriesToGlobal(): Promise<void> {
  await ServiceCategory.updateMany({}, { $unset: { businessId: '' } });

  for (const slug of LEGACY_CATEGORY_SLUGS) {
    await ServiceCategory.updateMany({ slug, isDeleted: false }, { $set: { isDeleted: true } });
  }

  logger.info('Migrated service categories to global scope');
}

export async function seedCategoryTree(
  nodes: CategorySeedNode[],
  parentId: import('mongoose').Types.ObjectId | null = null,
): Promise<Map<string, import('mongoose').Types.ObjectId>> {
  const slugToId = new Map<string, import('mongoose').Types.ObjectId>();

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const sortOrder = node.sortOrder ?? index + 1;

    const category = await ServiceCategory.findOneAndUpdate(
      { slug: node.slug },
      {
        $set: {
          parentId,
          name: node.name,
          slug: node.slug,
          description: node.description,
          sortOrder,
          isActive: true,
          isDeleted: false,
        },
        $unset: { businessId: '' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    slugToId.set(node.slug, category._id);

    if (node.children?.length) {
      const childMap = await seedCategoryTree(node.children, category._id);
      childMap.forEach((id, slug) => slugToId.set(slug, id));
    }
  }

  return slugToId;
}

export async function seedMyEasyHandCategories(): Promise<Map<string, import('mongoose').Types.ObjectId>> {
  await migrateCategoriesToGlobal();
  const slugToId = await seedCategoryTree(MYEASYHAND_CATEGORY_TREE);
  logger.info(`Seeded ${slugToId.size} global service categories`);
  return slugToId;
}
