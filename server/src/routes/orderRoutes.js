import { Router } from 'express';
import { createCheckout, getConfirmation, lookupOrder } from '../controllers/orderController.js';
import { withValidation } from '../middleware/validate.js';
import { checkoutLimiter, confirmationLimiter, lookupLimiter } from '../middleware/rateLimits.js';
import { checkoutRules, sessionIdRule, lookupRules } from '../validators/orderValidators.js';

const router = Router();

router.post('/checkout', checkoutLimiter, withValidation(checkoutRules), createCheckout);
router.get('/confirmation/:sessionId', confirmationLimiter, withValidation(sessionIdRule), getConfirmation);
router.post('/lookup', lookupLimiter, withValidation(lookupRules), lookupOrder);

export default router;
