import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

const EDITABLE_FIELDS = ['name', 'description', 'image', 'isVisible', 'sortOrder'];

function pick(source) {
  return Object.fromEntries(EDITABLE_FIELDS.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
}

async function withProductCounts(categories, publishedOnly) {
  const counts = await Product.aggregate([
    { $match: publishedOnly ? { isPublished: true } : {} },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((category) => ({ ...category.toJSON(), productCount: byId.get(String(category._id)) || 0 }));
}

export async function listCategories(_req, res) {
  const categories = await Category.find({ isVisible: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ categories: await withProductCounts(categories, true) });
}

export async function listAdminCategories(_req, res) {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ categories: await withProductCounts(categories, false) });
}

export async function createCategory(req, res) {
  const data = pick(req.body);
  data.slug = slugify(req.body.slug || data.name);
  if (!data.slug) throw ApiError.badRequest('Please provide a valid name', { name: 'Please provide a valid name' });
  const category = await Category.create(data);
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const data = pick(req.body);
  if (req.body.slug !== undefined) {
    const slug = slugify(req.body.slug || data.name || category.name);
    if (slug) data.slug = slug;
  }
  category.set(data);
  await category.save();
  res.json({ category });
}

export async function deleteCategory(req, res) {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    throw ApiError.conflict(
      `This category still has ${inUse} product${inUse === 1 ? '' : 's'}. Move or delete them first, or hide the category instead.`
    );
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  res.status(204).end();
}
