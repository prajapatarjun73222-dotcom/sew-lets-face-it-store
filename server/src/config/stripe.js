import Stripe from 'stripe';
import { config } from './env.js';

let client = null;

export function isStripeConfigured() {
  return Boolean(config.stripeSecretKey);
}

export function getStripe() {
  if (!isStripeConfigured()) return null;
  if (!client) client = new Stripe(config.stripeSecretKey);
  return client;
}
