import { Router } from 'express';
import { param } from 'express-validator';
import {
  listProducts,
  featuredProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import {
  createProductRules,
  updateProductRules,
  idParamRule,
  listProductRules,
} from '../validators/productValidators.js';

const router = Router();

router.get('/', withValidation(listProductRules), listProducts);
router.get('/featured', featuredProducts);
router.get(
  '/:slug',
  withValidation([param('slug').isSlug().isLength({ max: 100 }).withMessage('Invalid product')]),
  getProductBySlug
);

router.post('/', adminOnly, withValidation(createProductRules), createProduct);
router.put('/:id', adminOnly, withValidation(updateProductRules), updateProduct);
router.delete('/:id', adminOnly, withValidation(idParamRule), deleteProduct);

export default router;
