import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { slugify } from '../utils/slugify.js';
import { categories, products } from './demoContent.js';

assertEnv(['MONGODB_URI']);

const reset = process.argv.includes('--reset');

async function run() {
  await connectDB();

  if (reset) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Setting.deleteMany({})]);
    console.log('Cleared products, categories and settings.');
  }

  const categoryIds = {};
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $setOnInsert: category },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    categoryIds[category.slug] = doc._id;
  }
  console.log(`Categories ready: ${categories.length}`);

  let created = 0;
  for (const product of products) {
    const slug = slugify(product.name);
    const exists = await Product.exists({ slug });
    if (exists) continue;
    await Product.create({ ...product, slug, category: categoryIds[product.category], isPublished: true });
    created += 1;
  }
  console.log(`Products created: ${created} (skipped ${products.length - created} that already existed)`);

  await Setting.getSingleton();
  console.log('Site settings ready.');
  console.log('Note: demo prices, stock levels and images are illustrative and can be edited in /admin.');
}

run()
  .catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
