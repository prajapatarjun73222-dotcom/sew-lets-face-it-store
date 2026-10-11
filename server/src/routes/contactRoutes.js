import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createEnquiry,
  listEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from '../controllers/contactController.js';
import { ENQUIRY_TYPES, ENQUIRY_STATUSES } from '../models/ContactEnquiry.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimits.js';

const router = Router();
const idRule = param('id').isMongoId().withMessage('Invalid enquiry id');

router.post(
  '/',
  formLimiter,
  withValidation([
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Please enter your name (2-80 characters)'),
    body('email').isString().trim().isEmail().withMessage('Please enter a valid email address').isLength({ max: 120 }),
    body('enquiryType').optional().isIn(ENQUIRY_TYPES).withMessage('Please choose a valid enquiry type'),
    body('interest').optional().isString().trim().isLength({ max: 120 }).withMessage('Interest is too long'),
    body('productReference').optional().isString().trim().isLength({ max: 160 }).withMessage('Product reference is too long'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 10, max: 3000 })
      .withMessage('Please write a message of at least 10 characters (max 3000)'),
  ]),
  createEnquiry
);

router.get(
  '/',
  adminOnly,
  withValidation([query('status').optional({ values: 'falsy' }).isIn(ENQUIRY_STATUSES).withMessage('Invalid status')]),
  listEnquiries
);
router.get('/:id', adminOnly, withValidation([idRule]), getEnquiry);
router.patch(
  '/:id',
  adminOnly,
  withValidation([
    idRule,
    body('status').optional().isIn(ENQUIRY_STATUSES).withMessage('Invalid status'),
    body('adminNotes').optional().isString().trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
  ]),
  updateEnquiry
);
router.delete('/:id', adminOnly, withValidation([idRule]), deleteEnquiry);

export default router;
