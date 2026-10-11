import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const error of result.array()) {
    const field = error.path || error.param || 'request';
    if (!errors[field]) errors[field] = error.msg;
  }
  throw ApiError.badRequest('Please check the highlighted fields', errors);
}

export const withValidation = (rules) => [...rules, validate];
