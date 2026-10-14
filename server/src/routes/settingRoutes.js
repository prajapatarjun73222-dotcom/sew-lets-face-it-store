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
    body('contactPhone')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .matches(/^[+\d][\d\s()-]{6,24}$/)
      .withMessage('Please enter a valid phone number'),
    body('classes').optional().isObject(),
    body('classes.enabled').optional().isBoolean().withMessage('Must be true or false').toBoolean(),
    body('classes.offerActive').optional().isBoolean().withMessage('Must be true or false').toBoolean(),
    body('classes.regularPrice').optional().isFloat({ min: 1, max: 1000 }).withMessage('Price must be between £1 and £1,000').toFloat(),
    body('classes.offerPrice').optional().isFloat({ min: 1, max: 1000 }).withMessage('Price must be between £1 and £1,000').toFloat(),
    body('classes.capacity').optional().isInt({ min: 1, max: 50 }).withMessage('Places must be between 1 and 50').toInt(),
    body('classes.weeksAhead').optional().isInt({ min: 1, max: 26 }).withMessage('Choose between 1 and 26 weeks').toInt(),
    body('classes.durationMinutes')
      .optional()
      .isInt({ min: 15, max: 600 })
      .withMessage('Length must be between 15 and 600 minutes')
      .toInt(),
    body('classes.schedule').optional().isArray({ max: 14 }).withMessage('Up to 14 weekly class times are allowed'),
    body('classes.schedule.*.weekday').isInt({ min: 0, max: 6 }).withMessage('Choose a day of the week').toInt(),
    body('classes.schedule.*.time')
      .isString()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('Use a time such as 18:00'),
    body('classes.venue').optional().isString().trim().isLength({ max: 200 }).withMessage('Venue is too long'),
    optionalUrl('classes.image'),
  ]),
  updateSettings
);

export default router;
