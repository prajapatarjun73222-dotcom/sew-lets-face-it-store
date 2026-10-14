import { Router } from 'express';
import Product, { LOW_STOCK_THRESHOLD } from '../models/Product.js';
import Category from '../models/Category.js';
import ContactEnquiry from '../models/ContactEnquiry.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Order from '../models/Order.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import { listAdminProducts, getProductById } from '../controllers/productController.js';
import { listAdminCategories } from '../controllers/categoryController.js';
import { listOrders, getOrder, updateOrder } from '../controllers/adminOrderController.js';
import { listProductRules, idParamRule } from '../validators/productValidators.js';
import { adminListRules, orderIdRule, adminUpdateRules } from '../validators/orderValidators.js';
import {
  listSessions,
  createSession,
  updateSession,
  listSessionBookings,
  updateBooking,
  classStats,
} from '../controllers/adminClassController.js';
import {
  adminSessionListRules,
  adminSessionCreateRules,
  adminSessionUpdateRules,
  classSessionIdRule,
  adminBookingListRules,
  adminBookingUpdateRules,
} from '../validators/classValidators.js';

const router = Router();

router.use(adminOnly);

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

router.get('/stats', async (_req, res) => {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStock,
    newEnquiries,
    totalCategories,
    subscribers,
    recentEnquiries,
    lowStockList,
    ordersToFulfil,
    paidOrders,
    revenue,
    recentOrders,
    classes,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isPublished: true }),
    Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ stock: 0 }),
    ContactEnquiry.countDocuments({ status: 'new' }),
    Category.countDocuments(),
    NewsletterSubscriber.countDocuments(),
    ContactEnquiry.find().sort({ createdAt: -1 }).limit(5).select('name enquiryType status createdAt'),
    Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1 }).limit(6).select('name slug stock images'),
    Order.countDocuments({ status: { $in: ['paid', 'processing'] } }),
    Order.countDocuments({ status: { $in: PAID_STATUSES } }),
    Order.aggregate([{ $match: { status: { $in: PAID_STATUSES } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find({ status: { $ne: 'pending_payment' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customer.name status total createdAt'),
    classStats(),
  ]);

  res.json({
    stats: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStock,
      newEnquiries,
      totalCategories,
      subscribers,
      ordersToFulfil,
      paidOrders,
      revenue: Math.round((revenue[0]?.total || 0) * 100) / 100,
      ...classes,
    },
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    recentEnquiries,
    lowStockList,
    recentOrders,
  });
});

router.get('/products', withValidation(listProductRules), listAdminProducts);
router.get('/products/:id', withValidation(idParamRule), getProductById);
router.get('/categories', listAdminCategories);

router.get('/orders', withValidation(adminListRules), listOrders);
router.get('/orders/:id', withValidation(orderIdRule), getOrder);
router.patch('/orders/:id', withValidation(adminUpdateRules), updateOrder);

router.get('/classes/sessions', withValidation(adminSessionListRules), listSessions);
router.post('/classes/sessions', withValidation(adminSessionCreateRules), createSession);
router.patch('/classes/sessions/:id', withValidation(adminSessionUpdateRules), updateSession);
router.get(
  '/classes/sessions/:id/bookings',
  withValidation([...classSessionIdRule, ...adminBookingListRules]),
  listSessionBookings
);
router.patch('/classes/bookings/:id', withValidation(adminBookingUpdateRules), updateBooking);

export default router;
