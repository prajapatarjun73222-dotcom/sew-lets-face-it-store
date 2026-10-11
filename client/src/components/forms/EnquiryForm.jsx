import { useState } from 'react';
import { Send } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import useApi from '../../hooks/useApi';
import { isEmail } from '../../utils/format';

export const ENQUIRY_TYPES = ['General enquiry', 'Product enquiry', 'Custom creation', 'Personalised gift', 'Other'];

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!isEmail(values.email)) errors.email = 'Please enter a valid email address.';
  if (!ENQUIRY_TYPES.includes(values.enquiryType)) errors.enquiryType = 'Please choose an enquiry type.';
  if (values.message.trim().length < 10) errors.message = 'Please tell us a little more (at least 10 characters).';
  if (values.message.length > 3000) errors.message = 'Please keep your message under 3000 characters.';
  return errors;
}

export default function EnquiryForm({ defaultType = 'General enquiry', defaultProduct = '', messagePlaceholder, onSuccess }) {
  const initial = { name: '', email: '', enquiryType: defaultType, interest: '', productReference: defaultProduct, message: '' };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { data: categoryData } = useApi('/categories');
  const categories = categoryData?.categories || [];

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ type: 'error', message: 'Please check the highlighted fields.' });
      return;
    }
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const { data } = await api.post('/contact', {
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
      setStatus({ type: 'success', message: data.message });
      setValues({ ...initial, productReference: '' });
      onSuccess?.(data);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setStatus({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  if (status.type === 'success') {
    return (
      <div className="space-y-5">
        <Alert type="success" title="Enquiry sent">
          {status.message}
        </Alert>
        <button type="button" onClick={() => setStatus({ type: '', message: '' })} className="text-sm text-terracotta underline">
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status.type === 'error' && <Alert type="error">{status.message}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Your name" required error={errors.name}>
          {(props) => <input {...props} value={values.name} onChange={update('name')} autoComplete="name" maxLength={80} />}
        </FormField>
        <FormField label="Email address" required error={errors.email}>
          {(props) => (
            <input {...props} type="email" value={values.email} onChange={update('email')} autoComplete="email" maxLength={120} />
          )}
        </FormField>
        <FormField label="Enquiry type" required error={errors.enquiryType}>
          {(props) => (
            <select {...props} value={values.enquiryType} onChange={update('enquiryType')}>
              {ENQUIRY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Product or category of interest" error={errors.interest}>
          {(props) => (
            <select {...props} value={values.interest} onChange={update('interest')}>
              <option value="">Not sure yet</option>
              {categories.map((category) => (
                <option key={category._id}>{category.name}</option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <FormField label="Product reference" hint="Optional - the name of a product you saw on the site." error={errors.productReference}>
        {(props) => (
          <input {...props} value={values.productReference} onChange={update('productReference')} maxLength={160} />
        )}
      </FormField>
      <FormField label="Message" required error={errors.message} hint={`${values.message.length}/3000`}>
        {(props) => (
          <textarea
            {...props}
            rows={5}
            value={values.message}
            onChange={update('message')}
            maxLength={3000}
            placeholder={messagePlaceholder || 'How can we help?'}
          />
        )}
      </FormField>
      <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">We'll only use your details to reply to this enquiry.</p>
        <Button type="submit" loading={submitting}>
          {!submitting && <Send className="size-4" aria-hidden />} Send Enquiry
        </Button>
      </div>
    </form>
  );
}
