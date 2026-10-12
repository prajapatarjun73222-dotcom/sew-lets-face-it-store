import { Router } from 'express';
import { body } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';

const router = Router();

const optionalUrl = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Must be a valid http(s) URL');

router.get('/', getSettings);
router.put(
  '/',
  adminOnly,
  withValidation([
    body('brandName').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Brand name must be 2-80 characters'),
    body('brandDescription').optional().isString().trim().isLength({ max: 600 }).withMessage('Description is too long'),
    body('contactEmail').optional({ values: 'falsy' }).isString().trim().isEmail().withMessage('Please enter a valid email address'),
    body('announcement').optional().isString().trim().isLength({ max: 160 }).withMessage('Announcement must be 160 characters or fewer'),
    body('social').optional().isObject(),
    optionalUrl('social.instagram'),
    optionalUrl('social.facebook'),
    optionalUrl('social.etsy'),
    optionalUrl('social.website'),
    body('images').optional().isObject(),
    optionalUrl('images.story'),
    optionalUrl('images.custom'),
    optionalUrl('images.banner'),
    body('images.hero').optional().isArray({ max: 5 }).withMessage('Up to 5 hero images are allowed'),
    optionalUrl('images.hero.*'),
    body('images.instagram').optional().isArray({ max: 12 }).withMessage('Up to 12 gallery images are allowed'),
    optionalUrl('images.instagram.*'),
    body('orders').optional().isObject(),
    body('orders.enabled').optional().isBoolean().withMessage('Must be true or false').toBoolean(),
    body('orders.shippingFlatRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Shipping must be between £0 and £100')
      .toFloat(),
    body('orders.freeShippingOver')
      .optional()
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Enter 0 to turn free shipping off, or an amount up to £10,000')
      .toFloat(),
  ]),
  updateSettings
);

export default router;
