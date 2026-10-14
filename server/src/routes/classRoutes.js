import { Router } from 'express';
import { listClasses, bookClass, getBookingConfirmation, releaseBooking } from '../controllers/classController.js';
import { withValidation } from '../middleware/validate.js';
import { classBookingLimiter, confirmationLimiter } from '../middleware/rateLimits.js';
import { bookClassRules, stripeSessionIdRule, releaseRules } from '../validators/classValidators.js';

const router = Router();

router.get('/', listClasses);
router.post('/book', classBookingLimiter, withValidation(bookClassRules), bookClass);
router.get('/bookings/confirmation/:sessionId', confirmationLimiter, withValidation(stripeSessionIdRule), getBookingConfirmation);
router.post('/bookings/release', confirmationLimiter, withValidation(releaseRules), releaseBooking);

export default router;
