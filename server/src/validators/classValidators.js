import { body, param, query } from 'express-validator';
import { BOOKING_STATUSES } from '../models/ClassBooking.js';

export const bookClassRules = [
  body('sessionId').isMongoId().withMessage('Please choose a date'),
  body('places').isInt({ min: 1, max: 50 }).withMessage('Please choose how many places you need').toInt(),
  body('name')
    .isString()
    .withMessage('Please enter your full name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Please enter your full name (2-80 characters)'),
  body('email')
    .isString()
    .withMessage('Please enter a valid email address')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 120 }),
  body('phone')
    .isString()
    .withMessage('Please enter a phone number so we can reach you about the class')
    .trim()
    .matches(/^[+\d][\d\s()-]{6,24}$/)
    .withMessage('Please enter a valid phone number'),
];

export const stripeSessionIdRule = [
  param('sessionId').matches(/^cs_(test|live)_[A-Za-z0-9]+$/).withMessage('Invalid checkout session'),
];

export const releaseRules = [
  body('sessionId').isString().matches(/^cs_(test|live)_[A-Za-z0-9]+$/).withMessage('Invalid checkout session'),
];

export const classSessionIdRule = [param('id').isMongoId().withMessage('Invalid class date')];

export const adminSessionListRules = [
  query('range').optional({ values: 'falsy' }).isIn(['upcoming', 'past']).withMessage('Invalid range'),
];

export const adminSessionUpdateRules = [
  ...classSessionIdRule,
  body('capacity').optional().isInt({ min: 0, max: 50 }).withMessage('Places must be between 0 and 50').toInt(),
  body('status').optional().isIn(['scheduled', 'cancelled']).withMessage('Invalid status'),
  body('note').optional().isString().trim().isLength({ max: 300 }).withMessage('Note must be 300 characters or fewer'),
];

export const adminSessionCreateRules = [
  body('date').isISO8601({ strict: true }).withMessage('Please choose a date').bail().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('time').isString().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Use a time such as 18:00'),
  body('capacity').optional().isInt({ min: 1, max: 50 }).withMessage('Places must be between 1 and 50').toInt(),
  body('durationMinutes')
    .optional()
    .isInt({ min: 15, max: 600 })
    .withMessage('Length must be between 15 and 600 minutes')
    .toInt(),
  body('note').optional().isString().trim().isLength({ max: 300 }).withMessage('Note must be 300 characters or fewer'),
];

export const bookingIdRule = [param('id').isMongoId().withMessage('Invalid booking')];

export const adminBookingUpdateRules = [
  ...bookingIdRule,
  body('status').optional().isIn(['cancelled', 'refunded']).withMessage('Invalid status'),
  body('adminNotes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
];

export const adminBookingListRules = [
  query('status').optional({ values: 'falsy' }).isIn(BOOKING_STATUSES).withMessage('Invalid status'),
];
