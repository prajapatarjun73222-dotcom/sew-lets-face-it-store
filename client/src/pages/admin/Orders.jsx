import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Mail, Receipt, Search } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, ConfirmDialog } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { OrderItems, OrderStatusBadge, OrderTotals, ORDER_STATUS_LABELS } from '../../components/orders/OrderSummary';
import { formatDate, formatDateTime, formatPrice } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'To fulfil' },
  { value: 'shipped', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'pending_payment', label: 'Awaiting payment' },
];

const ACTIONS = [
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancel order', confirm: true },
  { value: 'refunded', label: 'Mark refunded', confirm: true },
];

function allowedActions(status) {
  if (status === 'refunded') return [];
  if (status === 'cancelled') return ['refunded'];
  if (status === 'pending_payment') return ['cancelled'];
  return ACTIONS.map((a) => a.value).filter((v) => v !== status);
}

function stripeLink(order) {
  if (!order.stripePaymentIntentId) return '';
  const test = order.stripeSessionId?.startsWith('cs_test_') ? 'test/' : '';
  return `https://dashboard.stripe.com/${test}payments/${order.stripePaymentIntentId}`;
}

function OrderDetail({ order, onUpdated, onBack }) {
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [notes, setNotes] = useState(order.adminNotes || '');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setTracking(order.trackingNumber || '');
    setNotes(order.adminNotes || '');
  }, [order]);

  const update = async (changes, message) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}`, changes);
      onUpdated(data.order);
      notify(message);
      setConfirm(null);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (action) => {
    if (action.confirm) setConfirm(action);
    else update({ status: action.value }, `Order marked as ${ORDER_STATUS_LABELS[action.value].toLowerCase()}.`);
  };

  const allowed = allowedActions(order.status);
  const address = order.shippingAddress || {};
  const paymentUrl = stripeLink(order);
  const mailto = `mailto:${order.email}?subject=${encodeURIComponent(`Your Sew Lets Face It order ${order.orderNumber}`)}`;

  return (
    <Card className="p-6">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-terracotta lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Back to list
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl tracking-wide">{order.orderNumber}</h2>
          <p className="mt-1 text-xs text-muted">
            Placed {formatDateTime(order.createdAt)}
            {order.paidAt && ` · Paid ${formatDateTime(order.paidAt)}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.stockIssue && (
        <Alert type="warning" className="mt-5" title="Stock issue">
          Some items had run out by the time payment completed, so their stock could not be deducted. Check you can make
          them, or contact the customer to offer an alternative or a refund.
        </Alert>
      )}

      <dl className="mt-6 grid gap-5 border-y border-beige py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted uppercase">Customer</dt>
          <dd className="mt-1">
            {order.customer?.name}
            <br />
            <a href={mailto} className="text-terracotta hover:underline">
              {order.email}
            </a>
            {order.customer?.phone && (
              <>
                <br />
                <a href={`tel:${order.customer.phone}`} className="hover:underline">
                  {order.customer.phone}
                </a>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Deliver to</dt>
          <dd className="mt-1 leading-relaxed">
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}
            {address.county && `, ${address.county}`}
            <br />
            {address.postcode}
          </dd>
        </div>
      </dl>

      <div className="mt-2">
        <OrderItems items={order.items} />
      </div>
      <div className="mt-2 border-t border-beige pt-4 sm:ml-auto sm:max-w-xs">
        <OrderTotals subtotal={order.subtotal} shippingCost={order.shippingCost} total={order.total} />
      </div>

      <div className="mt-6 space-y-5 border-t border-beige pt-5">
        {allowed.length > 0 && (
          <div>
            <span className="label">Update status</span>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.filter((a) => allowed.includes(a.value)).map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={saving}
                  onClick={() => setStatus(action)}
                  className={`rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                    action.confirm ? 'border-red-200 text-red-800 hover:border-red-400' : 'border-beige-dark hover:border-charcoal'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="tracking" className="label">
              Tracking number
            </label>
            <input id="tracking" className="input" value={tracking} maxLength={80} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <Button
            size="sm"
            variant="light"
            disabled={saving || tracking === (order.trackingNumber || '')}
            onClick={() => update({ trackingNumber: tracking.trim() }, 'Tracking number saved.')}
          >
            Save tracking
          </Button>
        </div>

        <div>
          <label htmlFor="order-notes" className="label">
            Private notes
          </label>
          <textarea
            id="order-notes"
            rows={3}
            className="input"
            maxLength={2000}
            value={notes}
            placeholder="Only visible to admins"
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="light" disabled={saving || notes === (order.adminNotes || '')} onClick={() => update({ adminNotes: notes }, 'Notes saved.')}>
              Save notes
            </Button>
          </div>
        </div>

        {order.statusHistory?.length > 0 && (
          <div>
            <span className="label">History</span>
            <ol className="space-y-1.5 text-xs text-muted">
              {order.statusHistory.map((entry, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span>
                    {ORDER_STATUS_LABELS[entry.status] || entry.status}
                    {entry.note && ` - ${entry.note}`}
                  </span>
                  <span className="shrink-0">{formatDateTime(entry.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-beige pt-5">
        <Button href={mailto} size="sm">
          <Mail className="size-4" aria-hidden /> Email customer
        </Button>
        {paymentUrl && (
          <Button href={paymentUrl} size="sm" variant="light" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden /> View payment in Stripe
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.value === 'refunded' ? 'Mark as refunded?' : 'Cancel this order?'}
        confirmLabel={confirm?.label}
        cancelLabel="Keep order"
        onCancel={() => setConfirm(null)}
        onConfirm={() => update({ status: confirm.value }, `Order ${confirm.value}.`)}
        loading={saving}
      >
        <p>
          Stock for this order will be returned to the shop.
          {order.paidAt &&
            ' This does not move any money - issue the refund from the Stripe dashboard (use "View payment in Stripe").'}
        </p>
      </ConfirmDialog>
    </Card>
  );
}

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const search = params.get('search') || '';
  const page = Number(params.get('page')) || 1;
  const selectedId = params.get('id');
  const [searchInput, setSearchInput] = useState(search);

  const query = { page, ...(status ? { status } : {}), ...(search ? { search } : {}) };
  const { data, loading, error, setData } = useApi('/admin/orders', { params: query });
  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const { data: single, setData: setSingle } = useApi(selectedId ? `/admin/orders/${selectedId}` : null, {
    enabled: Boolean(selectedId),
  });
  const detail = single?.order?._id === selectedId ? single.order : null;

  const setParam = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const onUpdated = (order) => {
    setSingle({ order });
    setData((d) => d && { ...d, orders: d.orders.map((o) => (o._id === order._id ? { ...o, status: order.status, stockIssue: order.stockIssue } : o)) });
  };

  return (
    <>
      <PageHeader title="Orders" description="Paid orders from the website. Payments and refunds are handled in Stripe." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setParam({ status: f.value, id: '', page: '' })}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                status === f.value ? 'border-forest bg-forest text-cream' : 'border-beige-dark bg-white hover:border-forest'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          className="relative w-full lg:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ search: searchInput.trim(), page: '', id: '' });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            className="input pl-9"
            placeholder="Order number, name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search orders"
          />
        </form>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
        <Card className={`overflow-hidden ${detail ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="py-16 text-center text-terracotta">
              <Spinner label="Loading orders…" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={Receipt} title="No orders">
              {status || search ? 'Nothing matches this filter.' : 'Orders paid through the website will appear here.'}
            </EmptyState>
          ) : (
            <>
              <ul className="max-h-[70vh] divide-y divide-beige overflow-y-auto">
                {orders.map((o) => {
                  const qty = o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  return (
                    <li key={o._id}>
                      <button
                        type="button"
                        onClick={() => setParam({ id: o._id })}
                        className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-cream ${o._id === selectedId ? 'bg-beige/40' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium tracking-wide">{o.orderNumber}</span>
                          <span className="shrink-0 text-sm">{formatPrice(o.total)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted">
                            {o.customer?.name} · {qty} {qty === 1 ? 'item' : 'items'} · {formatDate(o.createdAt)}
                          </span>
                          <OrderStatusBadge status={o.status} />
                        </div>
                        {o.stockIssue && <p className="mt-1 text-[11px] font-medium text-amber-800">Stock issue - check order</p>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-beige px-4 py-3 text-xs">
                  <button type="button" disabled={page <= 1} onClick={() => setParam({ page: page - 1 })} className="disabled:opacity-40">
                    Previous
                  </button>
                  <span className="text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.pages}
                    onClick={() => setParam({ page: page + 1 })}
                    className="disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        <div>
          {detail ? (
            <OrderDetail order={detail} onUpdated={onUpdated} onBack={() => setParam({ id: '' })} />
          ) : (
            <Card className="hidden h-full min-h-60 items-center justify-center p-10 text-center text-sm text-muted lg:flex">
              {selectedId ? <Spinner label="Loading order…" /> : 'Select an order to see the details.'}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
