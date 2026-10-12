import Product from '../models/Product.js';
import '../models/Category.js';
import Order, { generateOrderNumber } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';

export const toPence = (pounds) => Math.round(Number(pounds) * 100);
const fromPence = (pence) => pence / 100;

export function shippingFor(subtotalPence, orderSettings) {
  const flat = toPence(orderSettings?.shippingFlatRate ?? 0);
  const freeOver = toPence(orderSettings?.freeShippingOver ?? 0);
  if (freeOver > 0 && subtotalPence >= freeOver) return 0;
  return flat;
}

/**
 * Re-prices the bag from the database and checks availability.
 * Never trusts prices or stock sent by the browser.
 */
export async function buildOrderLines(cartItems, orderSettings) {
  const ids = [...new Set(cartItems.map((i) => String(i.productId)))];
  const products = await Product.find({ _id: { $in: ids } }).populate('category', 'isVisible');
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const problems = {};
  const requestedPerProduct = new Map();
  for (const item of cartItems) {
    const id = String(item.productId);
    requestedPerProduct.set(id, (requestedPerProduct.get(id) || 0) + item.quantity);
  }

  const lines = [];
  for (const item of cartItems) {
    const id = String(item.productId);
    const product = byId.get(id);
    if (!product || !product.isPublished || product.category?.isVisible === false) {
      problems[id] = 'This item is no longer available. Please remove it from your bag.';
      continue;
    }
    const requested = requestedPerProduct.get(id);
    if (product.stock < 1) {
      problems[id] = `${product.name} is sold out. Please remove it from your bag.`;
      continue;
    }
    if (requested > product.stock) {
      problems[id] = `Only ${product.stock} of ${product.name} available. Please reduce the quantity.`;
      continue;
    }

    const variantNames = product.variants.map((v) => v.name);
    const variant = (item.variant || '').trim();
    if (variantNames.length && !variantNames.includes(variant)) {
      problems[id] = `Please choose an option for ${product.name}.`;
      continue;
    }
    if (!variantNames.length && variant) {
      problems[id] = `${product.name} does not have that option.`;
      continue;
    }

    const unitPence = toPence(product.salePrice ?? product.price);
    lines.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] || '',
      variant,
      personalisation: product.isCustomisable ? (item.personalisation || '').trim() : '',
      unitPence,
      quantity: item.quantity,
    });
  }

  if (Object.keys(problems).length) {
    throw new ApiError(409, 'Some items in your bag have changed. Please review your bag.', problems);
  }

  const subtotalPence = lines.reduce((sum, l) => sum + l.unitPence * l.quantity, 0);
  const shippingPence = shippingFor(subtotalPence, orderSettings);

  return {
    items: lines.map(({ unitPence, ...line }) => ({
      ...line,
      unitPrice: fromPence(unitPence),
      lineTotal: fromPence(unitPence * line.quantity),
    })),
    subtotal: fromPence(subtotalPence),
    shippingCost: fromPence(shippingPence),
    total: fromPence(subtotalPence + shippingPence),
  };
}

export async function createPendingOrder({ lines, email, customer, shippingAddress }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const order = new Order({
        orderNumber: generateOrderNumber(),
        email,
        customer,
        shippingAddress: { ...shippingAddress, country: 'GB' },
        ...lines,
      });
      order.statusHistory.push({ status: 'pending_payment', note: 'Checkout started' });
      return await order.save();
    } catch (error) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }
  return null;
}

/**
 * Marks an order paid and deducts stock. Safe to call repeatedly (webhook retries,
 * confirmation page reloads): the atomic stockAdjusted flag guarantees one deduction.
 */
export async function finalizePaidOrder(session) {
  if (!session || session.payment_status !== 'paid') return null;
  const orderId = session.metadata?.orderId;
  if (!orderId) return null;

  const now = new Date();
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stripeSessionId: session.id, stockAdjusted: false, status: { $in: ['pending_payment', 'cancelled'] } },
    {
      $set: {
        status: 'paid',
        paidAt: now,
        stockAdjusted: true,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
      },
      $push: { statusHistory: { status: 'paid', note: 'Payment received via Stripe', at: now } },
    },
    { returnDocument: 'after' }
  );

  if (!order) return Order.findOne({ _id: orderId, stripeSessionId: session.id });

  let stockIssue = false;
  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    item.stockDeducted = result.modifiedCount === 1;
    if (!item.stockDeducted) stockIssue = true;
  }

  if (session.amount_total !== undefined && session.amount_total !== toPence(order.total)) {
    order.adminNotes = [order.adminNotes, `Stripe charged ${fromPence(session.amount_total)} but the order total is ${order.total}.`]
      .filter(Boolean)
      .join('\n');
  }
  order.stockIssue = stockIssue;
  await order.save();
  return order;
}

export async function cancelPendingOrder(session, note = 'Checkout session expired') {
  const orderId = session?.metadata?.orderId;
  if (!orderId) return null;
  return Order.findOneAndUpdate(
    { _id: orderId, stripeSessionId: session.id, status: 'pending_payment' },
    { $set: { status: 'cancelled' }, $push: { statusHistory: { status: 'cancelled', note, at: new Date() } } },
    { returnDocument: 'after' }
  );
}

/** Puts deducted stock back once, e.g. when an admin cancels or refunds a paid order. */
export async function restockOrder(orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockAdjusted: true },
    { $set: { stockAdjusted: false } },
    { returnDocument: 'after' }
  );
  if (!order) return null;
  for (const item of order.items) {
    if (!item.stockDeducted) continue;
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    item.stockDeducted = false;
  }
  await order.save();
  return order;
}
