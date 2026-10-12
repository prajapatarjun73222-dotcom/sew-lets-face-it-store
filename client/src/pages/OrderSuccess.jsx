import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import OrderSummary from '../components/orders/OrderSummary';

const POLL_MS = 2500;
const MAX_POLLS = 8;
const PAID = ['paid', 'processing', 'shipped', 'delivered'];

export default function OrderSuccess() {
  useDocumentTitle('Order Confirmation');
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [polls, setPolls] = useState(0);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    api
      .get(`/orders/confirmation/${encodeURIComponent(sessionId)}`)
      .then(({ data }) => active && setOrder(data.order))
      .catch((err) => active && setError(getErrorMessage(err, 'We could not load your order.')));
    return () => {
      active = false;
    };
  }, [sessionId, polls]);

  const isPaid = order && PAID.includes(order.status);

  useEffect(() => {
    if (!order || isPaid || order.status !== 'pending_payment' || polls >= MAX_POLLS) return undefined;
    const timer = setTimeout(() => setPolls((p) => p + 1), POLL_MS);
    return () => clearTimeout(timer);
  }, [order, isPaid, polls]);

  // Clear the bag once per completed checkout, even if this page is reloaded later.
  useEffect(() => {
    if (!isPaid || cleared.current) return;
    cleared.current = true;
    const flag = `slfi_cleared_${sessionId}`;
    try {
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, '1');
    } catch {
      // ignore storage errors
    }
    clear();
  }, [isPaid, sessionId, clear]);

  if (!sessionId) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Alert type="error" title="Missing order reference">
          We couldn't tell which order to show. If you have your order number, you can look it up below.
        </Alert>
        <Button to="/orders/track" className="mt-6">
          Track an Order
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Alert type="error" title="We couldn't load your order">
          {error} If you were charged, please contact us and we'll sort it out straight away.
        </Alert>
        <Button to="/contact" className="mt-6">
          Contact Us
        </Button>
      </div>
    );
  }

  if (!order) return <PageLoader />;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-10 max-w-2xl">
        {isPaid ? (
          <>
            <CheckCircle2 className="size-10 text-forest" aria-hidden />
            <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">Thank you for your order</h1>
            <p className="mt-3 leading-relaxed text-muted">
              Your payment was successful and your order <strong className="text-charcoal">{order.orderNumber}</strong> is
              confirmed. Keep your order number to track its progress - we'll contact you at {order.email} if we have any
              questions.
            </p>
          </>
        ) : order.status === 'pending_payment' ? (
          <>
            <Clock className="size-10 text-terracotta" aria-hidden />
            <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">Confirming your payment…</h1>
            <p className="mt-3 leading-relaxed text-muted">
              {polls >= MAX_POLLS
                ? `This is taking longer than usual. Please check back shortly using order number ${order.orderNumber}, or contact us if you were charged.`
                : 'This usually only takes a few seconds. Please keep this page open.'}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl text-charcoal sm:text-5xl">Order {order.orderNumber}</h1>
            <p className="mt-3 text-muted">This order was not completed. You have not been charged for it.</p>
          </>
        )}
      </div>

      <OrderSummary order={order} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/shop">Continue Shopping</Button>
        <Button to={`/orders/track?order=${encodeURIComponent(order.orderNumber)}`} variant="light">
          Track this Order
        </Button>
      </div>
    </div>
  );
}
