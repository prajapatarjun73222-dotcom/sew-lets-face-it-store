import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import useDocumentTitle from '../hooks/useDocumentTitle';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { isEmail } from '../utils/format';

export default function Account() {
  useDocumentTitle('Sign in');
  const { user, isAdmin, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;
  if (isAdmin) return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!isEmail(values.email)) found.email = 'Please enter a valid email address.';
    if (!values.password) found.password = 'Please enter your password.';
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const signedIn = await login(values.email.trim(), values.password);
      if (signedIn.role === 'admin') navigate(location.state?.from || '/admin', { replace: true });
      else setMessage('Signed in. Customer accounts are not available yet.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-md rounded-sm border border-beige bg-white p-8 sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-beige/60 text-terracotta">
          <Lock className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <h1 className="mt-5 text-4xl text-charcoal">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Shop owner sign-in for managing products and enquiries. Customer accounts are coming soon.
        </p>

        {user && !isAdmin && (
          <Alert type="info" className="mt-6" action={<button onClick={logout} className="text-xs underline">Sign out</button>}>
            You're signed in as {user.email}. This account doesn't have admin access.
          </Alert>
        )}

        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          {message && <Alert type="error">{message}</Alert>}
          <FormField label="Email" error={errors.email} required>
            {(props) => (
              <input
                {...props}
                type="email"
                autoComplete="username"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            )}
          </FormField>
          <FormField label="Password" error={errors.password} required>
            {(props) => (
              <input
                {...props}
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              />
            )}
          </FormField>
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
