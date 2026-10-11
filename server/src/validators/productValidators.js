import { body, param, query } from 'express-validator';

const urlOptions = { protocols: ['http', 'https'], require_protocol: true };

function productRules({ partial }) {
  const field = (name) => (partial ? body(name).optional() : body(name));
  return [
    field('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
    body('slug').optional().isString().trim().isLength({ max: 80 }).withMessage('Slug is too long'),
    body('description').optional().isString().trim().isLength({ max: 4000 }).withMessage('Description is too long'),
    field('price').isFloat({ min: 0, max: 10000 }).withMessage('Price must be between £0 and £10,000').toFloat(),
    body('salePrice')
      .optional({ values: 'null' })
      .customSanitizer((value) => (value === '' ? null : value))
      .custom((value) => value === null || (Number.isFinite(Number(value)) && Number(value) >= 0))
      .withMessage('Sale price must be a positive number')
      .customSanitizer((value) => (value === null ? null : Number(value))),
    field('category').isMongoId().withMessage('Please choose a valid category'),
    body('images').optional().isArray({ max: 10 }).withMessage('Up to 10 images are allowed'),
    body('images.*').isString().trim().isURL(urlOptions).withMessage('Each image must be a valid http(s) URL'),
    body('variants').optional().isArray({ max: 20 }).withMessage('Up to 20 variants are allowed'),
    body('variants.*.name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Variant names must be 1-60 characters'),
    body('variants.*.type').optional().isIn(['fabric', 'colour']).withMessage('Variant type must be fabric or colour'),
    body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock must be a whole number of 0 or more').toInt(),
    body('isFeatured').optional().isBoolean().toBoolean(),
    body('isPublished').optional().isBoolean().toBoolean(),
    body('isCustomisable').optional().isBoolean().toBoolean(),
  ];
}

export const createProductRules = productRules({ partial: false });
export const updateProductRules = [param('id').isMongoId().withMessage('Invalid product id'), ...productRules({ partial: true })];
export const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

export const listProductRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 48 }).withMessage('limit must be between 1 and 48'),
  query('minPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('minPrice must be a positive number'),
  query('maxPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('maxPrice must be a positive number'),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).withMessage('Invalid sort option'),
  query('search').optional().isString().isLength({ max: 100 }),
  query('category').optional().isString().isLength({ max: 400 }),
  query('inStock').optional().isIn(['true', 'false']),
];
