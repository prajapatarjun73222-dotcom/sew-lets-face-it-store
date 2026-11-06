import Order from '../models/Order.js';
import Setting from '../models/Setting.js';
import { config } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { ApiError } from '../utils/ApiError.js';
import {
  buildOrderLines,
  createPendingOrder,
  finalizePaidOrder,
  cancelPendingOrder,
  resolvePromoCode,
  applyPromoToLines,
  toPence,
} from '../services/orderService.js';
import { finalizePaidBooking, cancelPendingBooking } from '../services/classService.js';

const SESSION_TTL_SECONDS = 30 * 60;

export function clientBaseUrl(req) {
  const origin = req.get('origin');
  if (origin && config.clientUrls.includes(origin)) return origin;
  return config.clientUrls[0];
}

export async function validatePromo(req, res) {
  const promo = await resolvePromoCode(req.body.code);
  res.json({
    code: promo.code,
    type: promo.type,
    percent: promo.amount,
    label: `${promo.amount}% off`,
  });
}

export async function createCheckout(req, res) {
  const stripe = getStripe();
  const settings = await Setting.getSingleton();
  if (!stripe || !settings.orders?.enabled) {
    throw new ApiError(503, 'Online checkout is currently unavailable. Please contact us to place an order.');
  }

  const { items, email, name, phone, address, promoCode } = req.body;
  let lines = await buildOrderLines(items, settings.orders);
  if (promoCode) {
    const promo = await resolvePromoCode(promoCode);
    lines = applyPromoToLines(lines, promo);
  }

  const order = await createPendingOrder({
    lines,
    email,
    customer: { name, phone: phone || '' },
    shippingAddress: address,
  });

  const baseUrl = clientBaseUrl(req);
  const shippingPence = toPence(order.shippingCost);
  const shippingAddress = {
    line1: order.shippingAddress.line1,
    ...(order.shippingAddress.line2 ? { line2: order.shippingAddress.line2 } : {}),
    city: order.shippingAddress.city,
    ...(order.shippingAddress.county ? { state: order.shippingAddress.county } : {}),
    postal_code: order.shippingAddress.postcode,
    country: order.shippingAddress.country || 'GB',
  };

  let session;
  try {
    // Clearpay is offered only when Checkout has a UK shipping address.
    const customer = await stripe.customers.create({
      email: order.email,
      name: order.customer.name,
      shipping: { name: order.customer.name, address: shippingAddress },
    });

    const sessionParams = {
      mode: 'payment',
      currency: 'gbp',
      // Keep the charge in pounds. A converted currency hides Clearpay.
      adaptive_pricing: { enabled: false },
      customer: customer.id,
      client_reference_id: String(order._id),
      metadata: { type: 'order', orderId: String(order._id), orderNumber: order.orderNumber },
      payment_intent_data: {
        description: `Sew Lets Face It order ${order.orderNumber}`,
        metadata: { type: 'order', orderId: String(order._id), orderNumber: order.orderNumber },
      },
      line_items: order.items.map((item) => {
        const details = [item.variant && `Option: ${item.variant}`, item.personalisation && `Personalisation: ${item.personalisation}`]
          .filter(Boolean)
          .join(' · ');
        return {
          quantity: item.quantity,
          price_data: {
            currency: 'gbp',
            unit_amount: toPence(item.unitPrice),
            product_data: {
              name: item.name,
              ...(details ? { description: details.slice(0, 500) } : {}),
              ...(item.image ? { images: [item.image] } : {}),
            },
          },
        };
      }),
      shipping_address_collection: { allowed_countries: ['GB'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: shippingPence === 0 ? 'Free UK delivery' : 'UK delivery',
            fixed_amount: { amount: shippingPence, currency: 'gbp' },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?cancelled=1`,
    };

    if (order.discountPercent > 0) {
      const coupon = await stripe.coupons.create({
        percent_off: order.discountPercent,
        duration: 'once',
        name: order.promoCode.slice(0, 40),
        metadata: { orderId: String(order._id), promoCode: order.promoCode },
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (error) {
    order.setStatus('cancelled', 'Could not start Stripe checkout');
    await order.save();
    console.error('Stripe checkout session failed:', error.message);
    throw new ApiError(502, 'We could not start the secure payment page. Please try again in a moment.');
  }

  order.stripeSessionId = session.id;
  await order.save();

  res.status(201).json({ url: session.url, orderNumber: order.orderNumber });
}

export async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(503).json({ message: 'Stripe webhooks are not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), config.stripeWebhookSecret);
  } catch (error) {
    return res.status(400).json({ message: `Webhook signature verification failed: ${error.message}` });
  }

  const session = event.data.object;
  const isClassBooking = session?.metadata?.type === 'class_booking';
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (isClassBooking) await finalizePaidBooking(session);
      else await finalizePaidOrder(session);
      break;
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      if (isClassBooking) await cancelPendingBooking(session);
      else await cancelPendingOrder(session, event.type === 'checkout.session.expired' ? 'Checkout session expired' : 'Payment failed');
      break;
    default:
      break;
  }

  return res.json({ received: true });
}

export async function getConfirmation(req, res) {
  const { sessionId } = req.params;
  let order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) throw ApiError.notFound('We could not find that order.');

  // The webhook may not have arrived yet (or isn't set up locally), so ask Stripe directly.
  const stripe = getStripe();
  if (order.status === 'pending_payment' && stripe) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    order = (await finalizePaidOrder(session)) || order;
  }

  res.json({ order: order.toPublicJSON() });
}

export async function lookupOrder(req, res) {
  const { orderNumber, email } = req.body;
  const order = await Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    status: { $ne: 'pending_payment' },
  });
  if (!order) throw ApiError.notFound('We could not find an order with that number and email address.');
  res.json({ order: order.toPublicJSON() });
}
