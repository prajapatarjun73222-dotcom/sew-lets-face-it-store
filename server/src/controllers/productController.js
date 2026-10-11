import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify, escapeRegex } from '../utils/slugify.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { effectivePrice: 1, _id: 1 },
  price_desc: { effectivePrice: -1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: 1 },
};

const EDITABLE_FIELDS = [
  'name',
  'description',
  'price',
  'salePrice',
  'category',
  'images',
  'variants',
  'stock',
  'isFeatured',
  'isPublished',
  'isCustomisable',
];

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

async function uniqueSlug(base, excludeId) {
  const root = slugify(base) || 'product';
  let candidate = root;
  let counter = 2;
  while (await Product.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${root}-${counter++}`;
  }
  return candidate;
}

async function assertCategory(id) {
  if (!mongoose.isValidObjectId(id) || !(await Category.exists({ _id: id }))) {
    throw ApiError.badRequest('Please choose a valid category', { category: 'Please choose a valid category' });
  }
}

/**
 * Builds an aggregation over products that exposes `effectivePrice` (sale price when set)
 * and joins the category so filters, sorting and price ranges respect sale prices.
 */
function buildPipeline({ match, publicOnly, categorySlug, search, minPrice, maxPrice, inStock }) {
  const pipeline = [{ $match: match }];

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    pipeline.push({ $match: { $or: [{ name: regex }, { description: regex }] } });
  }

  pipeline.push(
    { $addFields: { effectivePrice: { $ifNull: ['$salePrice', '$price'] }, inStock: { $gt: ['$stock', 0] } } },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: !publicOnly } }
  );

  if (publicOnly) pipeline.push({ $match: { 'category.isVisible': true } });
  if (categorySlug) {
    const slugs = categorySlug.split(',').map((slug) => slug.trim()).filter(Boolean).slice(0, 10);
    if (slugs.length) pipeline.push({ $match: { 'category.slug': { $in: slugs } } });
  }
  if (inStock) pipeline.push({ $match: { stock: { $gt: 0 } } });

  const priceRange = {};
  if (Number.isFinite(minPrice)) priceRange.$gte = minPrice;
  if (Number.isFinite(maxPrice)) priceRange.$lte = maxPrice;
  if (Object.keys(priceRange).length) pipeline.push({ $match: { effectivePrice: priceRange } });

  return pipeline;
}

const categoryProjection = {
  'category.description': 0,
  'category.createdAt': 0,
  'category.updatedAt': 0,
  'category.__v': 0,
  __v: 0,
};

async function runListing(req, { publicOnly }) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const match = publicOnly ? { isPublished: true } : {};
  if (!publicOnly && req.query.status === 'published') match.isPublished = true;
  if (!publicOnly && req.query.status === 'hidden') match.isPublished = false;

  const pipeline = buildPipeline({
    match,
    publicOnly,
    categorySlug: typeof req.query.category === 'string' ? req.query.category : undefined,
    search: typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : undefined,
    minPrice: req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : undefined,
    inStock: req.query.inStock === 'true',
  });

  pipeline.push({
    $facet: {
      items: [{ $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: categoryProjection }],
      meta: [{ $count: 'total' }],
    },
  });

  const [result] = await Product.aggregate(pipeline);
  const total = result.meta[0]?.total || 0;

  return {
    products: result.items,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), hasMore: page * limit < total },
  };
}

export async function listProducts(req, res) {
  res.json(await runListing(req, { publicOnly: true }));
}

export async function listAdminProducts(req, res) {
  res.json(await runListing(req, { publicOnly: false }));
}

export async function featuredProducts(req, res) {
  const limit = Math.min(12, Math.max(1, Number.parseInt(req.query.limit, 10) || 8));
  const pipeline = buildPipeline({ match: { isPublished: true, isFeatured: true }, publicOnly: true });
  pipeline.push({ $sort: { updatedAt: -1 } }, { $limit: limit }, { $project: categoryProjection });
  res.json({ products: await Product.aggregate(pipeline) });
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: req.params.slug, isPublished: true }).populate(
    'category',
    'name slug isVisible'
  );
  if (!product || !product.category?.isVisible) throw ApiError.notFound('Product not found');

  const relatedPipeline = buildPipeline({
    match: { isPublished: true, _id: { $ne: product._id }, category: product.category._id },
    publicOnly: true,
  });
  relatedPipeline.push({ $sort: { isFeatured: -1, createdAt: -1 } }, { $limit: 4 }, { $project: categoryProjection });
  let related = await Product.aggregate(relatedPipeline);

  if (related.length < 4) {
    const fill = buildPipeline({
      match: { isPublished: true, _id: { $nin: [product._id, ...related.map((p) => p._id)] } },
      publicOnly: true,
    });
    fill.push({ $sort: { isFeatured: -1, createdAt: -1 } }, { $limit: 4 - related.length }, { $project: categoryProjection });
    related = related.concat(await Product.aggregate(fill));
  }

  res.json({ product: product.toJSON(), related });
}

export async function getProductById(req, res) {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product });
}

export async function createProduct(req, res) {
  const data = pick(req.body, EDITABLE_FIELDS);
  await assertCategory(data.category);
  data.slug = await uniqueSlug(req.body.slug || data.name);
  const product = await Product.create(data);
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const data = pick(req.body, EDITABLE_FIELDS);
  if (data.category !== undefined) await assertCategory(data.category);
  if (req.body.slug !== undefined && req.body.slug !== product.slug) {
    data.slug = await uniqueSlug(req.body.slug || data.name || product.name, product._id);
  }

  product.set(data);
  await product.save();
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.status(204).end();
}
