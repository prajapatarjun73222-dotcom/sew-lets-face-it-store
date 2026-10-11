import { Router } from 'express';
import Product, { LOW_STOCK_THRESHOLD } from '../models/Product.js';
import Category from '../models/Category.js';
import ContactEnquiry from '../models/ContactEnquiry.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import { listAdminProducts, getProductById } from '../controllers/productController.js';
import { listAdminCategories } from '../controllers/categoryController.js';
import { listProductRules, idParamRule } from '../validators/productValidators.js';

const router = Router();

router.use(adminOnly);

router.get('/stats', async (_req, res) => {
  const [totalProducts, activeProducts, lowStockProducts, outOfStock, newEnquiries, totalCategories, subscribers, recentEnquiries, lowStockList] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isPublished: true }),
      Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ stock: 0 }),
      ContactEnquiry.countDocuments({ status: 'new' }),
      Category.countDocuments(),
      NewsletterSubscriber.countDocuments(),
      ContactEnquiry.find().sort({ createdAt: -1 }).limit(5).select('name enquiryType status createdAt'),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1 }).limit(6).select('name slug stock images'),
    ]);

  res.json({
    stats: { totalProducts, activeProducts, lowStockProducts, outOfStock, newEnquiries, totalCategories, subscribers },
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    recentEnquiries,
    lowStockList,
  });
});

router.get('/products', withValidation(listProductRules), listAdminProducts);
router.get('/products/:id', withValidation(idParamRule), getProductById);
router.get('/categories', listAdminCategories);

export default router;
