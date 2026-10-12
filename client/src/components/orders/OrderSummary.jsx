import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, formatPrice, sizedImage } from '../../utils/format';

export const ORDER_STATUS_LABELS = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid - being prepared',
  processing: 'Being made / packed',
  shipped: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_TONES = {
  pending_payment: 'bg-amber-50 text-amber-900 border-amber-200',
  paid: 'bg-forest/10 text-forest border-forest/20',
  processing: 'bg-sage/15 text-forest border-sage/30',
  shipped: 'bg-terracotta/10 text-terracotta-dark border-terracotta/25',
  delivered: 'bg-forest text-cream border-forest',
  cancelled: 'bg-red-50 text-red-800 border-red-200',
  refunded: 'bg-beige text-charcoal border-beige-dark',
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[status] || STATUS_TONES.refunded}`}>
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}

export function OrderItems({ items }) {
  return (
    <ul className="divide-y divide-beige">
      {items.map((item, idx) => (
        <li key={`${item.slug}-${idx}`} className="flex gap-4 py-4">
          {item.image ? (
            <img src={sizedImage(item.image, 160)} alt="" className="h-20 w-16 shrink-0 rounded-sm object-cover" />
          ) : (
            <div className="h-20 w-16 shrink-0 rounded-sm bg-beige/60" />
          )}
          <div className="flex flex-1 justify-between gap-3 text-sm">
            <div>
              {item.slug ? (
                <Link to={`/product/${item.slug}`} className="font-medium text-charcoal hover:text-terracotta">
                  {item.name}
                </Link>
              ) : (
                <p className="font-medium text-charcoal">{item.name}</p>
              )}
              {item.variant && <p className="mt-1 text-xs text-muted">Option: {item.variant}</p>}
              {item.personalisation && <p className="mt-1 text-xs text-muted">Personalisation: “{item.personalisation}”</p>}
              <p className="mt-1 text-xs text-muted">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
            <p className="font-medium">{formatPrice(item.lineTotal)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ subtotal, shippingCost, total, estimate = false }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">UK delivery</dt>
        <dd>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</dd>
      </div>
      <div className="flex justify-between border-t border-beige pt-3 text-base font-medium">
        <dt>{estimate ? 'Estimated total' : 'Total'}</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

export default function OrderSummary({ order }) {
  const address = order.shippingAddress || {};
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section aria-labelledby="order-items-heading">
        <h2 id="order-items-heading" className="text-2xl text-charcoal">
          Items
        </h2>
        <div className="mt-3 border-y border-beige">
          <OrderItems items={order.items} />
        </div>
        <div className="mt-5 max-w-sm sm:ml-auto">
          <OrderTotals subtotal={order.subtotal} shippingCost={order.shippingCost} total={order.total} />
        </div>
      </section>

      <aside className="h-fit space-y-6 rounded-sm border border-beige bg-white p-6 text-sm">
        <div>
          <p className="eyebrow">Order</p>
          <p className="mt-1 font-medium tracking-wide">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-muted">Placed {formatDate(order.createdAt)}</p>
          <div className="mt-3">
            <OrderStatusBadge status={order.status} />
          </div>
          {order.trackingNumber && (
            <p className="mt-3">
              <span className="text-muted">Tracking number:</span> <span className="font-medium">{order.trackingNumber}</span>
            </p>
          )}
        </div>
        <div>
          <p className="eyebrow">Delivering to</p>
          <address className="mt-1 not-italic leading-relaxed">
            {order.customer?.name}
            <br />
            {address.line1}
            {address.line2 && (
              <>
                <br />
                {address.line2}
              </>
            )}
            <br />
            {address.city}
            {address.county && `, ${address.county}`}
            <br />
            {address.postcode}
          </address>
        </div>
        {order.statusHistory?.length > 0 && (
          <div>
            <p className="eyebrow">History</p>
            <ol className="mt-2 space-y-1.5 text-xs text-muted">
              {order.statusHistory.map((entry, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span>{ORDER_STATUS_LABELS[entry.status] || entry.status}</span>
                  <span>{formatDateTime(entry.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}
