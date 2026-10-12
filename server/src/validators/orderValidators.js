import { body, param, query } from 'express-validator';
import { ADMIN_SETTABLE_STATUSES, ORDER_STATUSES } from '../models/Order.js';

export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const ORDER_NUMBER = /^SLF-\d{6}-[A-Z0-9]{5}$/i;

const text = (field, label, min, max) =>
  body(field)
    .isString()
    .withMessage(`Please enter ${label}`)
    .trim()
    .isLength({ min, max })
    .withMessage(min > 0 ? `Please enter ${label} (${min}-${max} characters)` : `${label} is too long`);

export const checkoutRules = [
  body('items').isArray({ min: 1, max: 20 }).withMessage('Your bag must contain between 1 and 20 items'),
  body('items.*.productId').isMongoId().withMessage('Invalid product in your bag'),
  body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Quantities must be between 1 and 10').toInt(),
  body('items.*.variant').optional({ values: 'null' }).isString().trim().isLength({ max: 60 }),
  body('items.*.personalisation').optional({ values: 'null' }).isString().trim().isLength({ max: 300 }),
  body('email')
    .isString()
    .withMessage('Please enter a valid email address')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 120 }),
  text('name', 'your full name', 2, 80),
  body('phone')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .matches(/^[+\d][\d\s()-]{6,24}$/)
    .withMessage('Please enter a valid phone number'),
  body('address').isObject().withMessage('Please enter your delivery address'),
  text('address.line1', 'the first line of your address', 2, 120),
  body('address.line2').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }).withMessage('Address line 2 is too long'),
  text('address.city', 'your town or city', 2, 80),
  body('address.county').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }).withMessage('County is too long'),
  body('address.postcode')
    .isString()
    .withMessage('Please enter a valid UK postcode')
    .trim()
    .matches(UK_POSTCODE)
    .withMessage('Please enter a valid UK postcode')
    .customSanitizer((value) => value.toUpperCase().replace(/\s+/g, '').replace(/^(.+)(\d[A-Z]{2})$/, '$1 $2')),
];

export const sessionIdRule = [
  param('sessionId').matches(/^cs_(test|live)_[A-Za-z0-9]+$/).withMessage('Invalid checkout session'),
];

export const lookupRules = [
  body('orderNumber')
    .isString()
    .withMessage('Please enter your order number')
    .trim()
    .matches(ORDER_NUMBER)
    .withMessage('Order numbers look like SLF-261012-AB2CD'),
  body('email')
    .isString()
    .withMessage('Please enter the email address used for the order')
    .trim()
    .isEmail()
    .withMessage('Please enter the email address used for the order'),
];

export const adminListRules = [
  query('status').optional({ values: 'falsy' }).isIn([...ORDER_STATUSES, 'active']).withMessage('Invalid status'),
  query('search').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  query('page').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const orderIdRule = [param('id').isMongoId().withMessage('Invalid order id')];

export const adminUpdateRules = [
  ...orderIdRule,
  body('status').optional().isIn(ADMIN_SETTABLE_STATUSES).withMessage('Invalid status'),
  body('note').optional().isString().trim().isLength({ max: 300 }).withMessage('Note is too long'),
  body('trackingNumber').optional().isString().trim().isLength({ max: 80 }).withMessage('Tracking number is too long'),
  body('adminNotes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
];
