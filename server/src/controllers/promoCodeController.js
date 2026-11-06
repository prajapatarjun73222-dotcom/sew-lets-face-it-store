import PromoCode from '../models/PromoCode.js';
import { ApiError } from '../utils/ApiError.js';

const EDITABLE = ['code', 'type', 'amount', 'expiresAt', 'isActive'];

function pick(source) {
  return Object.fromEntries(EDITABLE.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
}

function normalizePayload(body) {
  const data = pick(body);
  if (data.code !== undefined) data.code = PromoCode.normalizeCode(data.code);
  if (data.type !== undefined) data.type = 'percentage';
  if (data.expiresAt === '' || data.expiresAt === null) data.expiresAt = null;
  else if (data.expiresAt !== undefined) data.expiresAt = new Date(data.expiresAt);
  return data;
}

export async function listPromoCodes(_req, res) {
  const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
  res.json({ promoCodes });
}

export async function createPromoCode(req, res) {
  const data = normalizePayload(req.body);
  if (!data.code) throw ApiError.badRequest('Please enter a code', { code: 'Please enter a code' });

  try {
    const promoCode = await PromoCode.create({
      code: data.code,
      type: 'percentage',
      amount: data.amount,
      expiresAt: data.expiresAt ?? null,
      isActive: data.isActive ?? true,
    });
    res.status(201).json({ promoCode });
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict('That promo code already exists', { code: 'That promo code already exists' });
    }
    throw error;
  }
}

export async function updatePromoCode(req, res) {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) throw ApiError.notFound('Promo code not found');

  const data = normalizePayload(req.body);
  promoCode.set(data);
  try {
    await promoCode.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict('That promo code already exists', { code: 'That promo code already exists' });
    }
    throw error;
  }
  res.json({ promoCode });
}

export async function deletePromoCode(req, res) {
  const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promoCode) throw ApiError.notFound('Promo code not found');
  res.status(204).end();
}
