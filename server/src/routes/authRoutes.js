import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { withValidation } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  withValidation([
    body('email').isString().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
    body('password').isString().isLength({ min: 1, max: 200 }).withMessage('Enter your password'),
  ]),
  login
);

router.get('/me', requireAuth, me);

export default router;
