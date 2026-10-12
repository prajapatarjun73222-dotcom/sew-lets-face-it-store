import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import useDocumentTitle from '../hooks/useDocumentTitle';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import OrderSummary from '../components/orders/OrderSummary';
import { isEmail } from '../utils/format';

const ORDER_NUMBER = /^SLF-\d{6}-[A-Z0-9]{5}$/i;

export default function OrderLookup() {
  useDocumentTitle('Track Your Order', 'Check the status of your Sew Lets Face It order.');
  const [params] = useSearchParams();
  const [values, setValues] = useState({ orderNumber: params.get('order') || '', email: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!ORDER_NUMBER.test(values.orderNumber.trim())) found.orderNumber = 'Order numbers look like SLF-261012-AB2CD.';
    if (!isEmail(values.email)) found.email = 'Please enter the email address used for the order.';
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;

    setLoading(true);
    setOrder(null);
    try {
      const { data } = await api.post('/orders/lookup', {
        orderNumber: values.orderNumber.trim().toUpperCase(),
        email: values.email.trim(),
      });
      setOrder(data.order);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Customer care</p>
        <h1 className="mt-2 text-4xl text-charcoal sm:text-5xl">Track Your Order</h1>
        <p className="mt-3 text-muted">
          Enter the order number from your confirmation page and the email address you used at checkout.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <FormField label="Order number" required error={errors.orderNumber}>
            {(props) => (
              <input
                {...props}
                value={values.orderNumber}
                onChange={update('orderNumber')}
                placeholder="SLF-261012-AB2CD"
                className={`${props.className} uppercase`}
                maxLength={20}
              />
            )}
          </FormField>
          <FormField label="Email address" required error={errors.email}>
            {(props) => (
              <input {...props} type="email" value={values.email} onChange={update('email')} autoComplete="email" maxLength={120} />
            )}
          </FormField>
          <Button type="submit" loading={loading} className="sm:mt-[26px]">
            {!loading && <Search className="size-4" aria-hidden />} Find Order
          </Button>
        </form>
        {message && (
          <Alert type="error" className="mt-6">
            {message}
          </Alert>
        )}
      </div>

      {order && (
        <div className="mt-12 border-t border-beige pt-10">
          <OrderSummary order={order} />
        </div>
      )}
    </div>
  );
}
