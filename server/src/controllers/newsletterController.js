import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { ApiError } from '../utils/ApiError.js';

export async function subscribe(req, res) {
  const email = req.body.email.toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email });
  if (!existing) await NewsletterSubscriber.create({ email, source: req.body.source || 'website' });

  // Same response either way so the endpoint does not reveal who is subscribed.
  res.status(201).json({ message: 'Thank you for subscribing! You will be the first to hear about new pieces.' });
}

export async function listSubscribers(_req, res) {
  const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });
  res.json({ subscribers });
}

export async function removeSubscriber(req, res) {
  const subscriber = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) throw ApiError.notFound('Subscriber not found');
  res.status(204).end();
}
