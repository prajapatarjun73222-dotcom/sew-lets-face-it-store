import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';

const router = Router();

const categoryRules = (partial) => {
  const field = (name) => (partial ? body(name).optional() : body(name));
  return [
    field('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('slug').optional().isString().trim().isLength({ max: 80 }),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description is too long'),
    body('image')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Image must be a valid http(s) URL'),
    body('isVisible').optional().isBoolean().toBoolean(),
    body('sortOrder').optional().isInt({ min: 0, max: 1000 }).withMessage('Sort order must be 0-1000').toInt(),
  ];
};

const idRule = param('id').isMongoId().withMessage('Invalid category id');

router.get('/', listCategories);
router.post('/', adminOnly, withValidation(categoryRules(false)), createCategory);
router.put('/:id', adminOnly, withValidation([idRule, ...categoryRules(true)]), updateCategory);
router.delete('/:id', adminOnly, withValidation([idRule]), deleteCategory);

export default router;
