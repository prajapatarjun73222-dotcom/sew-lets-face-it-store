import Order, { RESTOCK_STATUSES } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/slugify.js';
import { restockOrder } from '../services/orderService.js';

export async function listOrders(req, res) {
  const page = req.query.page || 1;
  const limit = req.query.limit || 25;
  const filter = {};

  if (req.query.status === 'active') filter.status = { $in: ['paid', 'processing'] };
  else if (req.query.status) filter.status = req.query.status;
  else filter.status = { $ne: 'pending_payment' };

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ orderNumber: pattern }, { email: pattern }, { 'customer.name': pattern }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('orderNumber email customer.name status total items.quantity stockIssue paidAt createdAt'),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ order });
}

export async function updateOrder(req, res) {
  let order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const { status, note, trackingNumber, adminNotes } = req.body;

  if (status && status !== order.status) {
    if (order.status === 'pending_payment' && status !== 'cancelled') {
      throw ApiError.badRequest('This order has not been paid yet. It can only be cancelled.');
    }
    if (order.status === 'refunded') {
      throw ApiError.badRequest('Refunded orders cannot be changed.');
    }
    if (order.status === 'cancelled' && status !== 'refunded') {
      throw ApiError.badRequest('Cancelled orders cannot be reopened. They can only be marked as refunded.');
    }
    if (RESTOCK_STATUSES.includes(status) && order.stockAdjusted) {
      order = (await restockOrder(order._id)) || order;
    }
    order.setStatus(status, note || '');
  }
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;

  await order.save();
  res.json({ order });
}
