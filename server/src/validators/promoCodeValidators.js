import { body, param } from 'express-validator';

export const promoCodeIdRule = [param('id').isMongoId().withMessage('Invalid promo code id')];

const codeField = (optional) => {
  const field = optional ? body('code').optional() : body('code');
  return field
    .isString()
    .withMessage('Please enter a code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Code must be 3-20 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Code can only contain letters and numbers')
    .customSanitizer((value) => String(value).toUpperCase());
};

const amountField = (optional) => {
  const field = optional ? body('amount').optional() : body('amount');
  return field
    .isFloat({ min: 1, max: 100 })
    .withMessage('Percentage must be between 1 and 100')
    .toFloat();
};

export const createPromoCodeRules = [
  codeField(false),
  body('type').optional().isIn(['percentage']).withMessage('Only percentage codes are supported'),
  amountField(false),
  body('expiresAt')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please enter a valid expiry date')
    .toDate(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const updatePromoCodeRules = [
  ...promoCodeIdRule,
  codeField(true),
  body('type').optional().isIn(['percentage']).withMessage('Only percentage codes are supported'),
  amountField(true),
  body('expiresAt')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || !Number.isNaN(Date.parse(value)))
    .withMessage('Please enter a valid expiry date')
    .customSanitizer((value) => {
      if (value === null || value === '') return null;
      return new Date(value);
    }),
  body('isActive').optional().isBoolean().toBoolean(),
];
