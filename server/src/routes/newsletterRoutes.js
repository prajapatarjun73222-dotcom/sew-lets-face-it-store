import { Router } from 'express';
import { body, param } from 'express-validator';
import { subscribe, listSubscribers, removeSubscriber } from '../controllers/newsletterController.js';
import { adminOnly } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.post(
  '/',
  formLimiter,
  withValidation([
    body('email').isString().trim().isEmail().withMessage('Please enter a valid email address').isLength({ max: 120 }),
    body('source').optional().isString().trim().isLength({ max: 40 }),
  ]),
  subscribe
);

router.get('/', adminOnly, listSubscribers);
router.delete(
  '/:id',
  adminOnly,
  withValidation([param('id').isMongoId().withMessage('Invalid subscriber id')]),
  removeSubscriber
);

export default router;
