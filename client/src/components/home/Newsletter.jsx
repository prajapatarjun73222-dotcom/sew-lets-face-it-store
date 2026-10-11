import { useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { isEmail } from '../../utils/format';
import Spinner from '../ui/Spinner';

function FlowerSketch({ className }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <circle cx="40" cy="30" r="5" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="40" cy="19" rx="5.5" ry="9" transform={`rotate(${deg} 40 30)`} />
        ))}
        <path d="M40 35c0 14-2 26-8 40M37 55c-8-2-14-8-16-14 8 0 14 5 16 14z" />
      </g>
    </svg>
  );
}

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setState({ status: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setState({ status: 'loading', message: '' });
    try {
      const { data } = await api.post('/newsletter', { email: email.trim(), source: 'homepage' });
      setState({ status: 'success', message: data.message });
      setEmail('');
    } catch (error) {
      setState({ status: 'error', message: getErrorMessage(error) });
    }
  };

  return (
    <section className="relative overflow-hidden bg-forest text-cream" aria-labelledby="newsletter-heading">
      <FlowerSketch className="absolute top-1/2 left-4 hidden h-24 -translate-y-1/2 text-cream/30 lg:block" />
      <div className="container-page flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:pl-24">
        <div>
          <h2 id="newsletter-heading" className="font-sans text-lg font-medium tracking-wide">
            Join Our Newsletter
          </h2>
          <p className="mt-1 text-sm text-cream/75">
            Be the first to hear about new collections, custom designs and updates.
          </p>
        </div>
        <form onSubmit={submit} noValidate className="w-full lg:max-w-md">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state.status === 'error') setState({ status: 'idle', message: '' });
              }}
              placeholder="Your email address"
              autoComplete="email"
              maxLength={120}
              aria-invalid={state.status === 'error'}
              aria-describedby="newsletter-feedback"
              className="flex-1 rounded-sm border border-cream/20 bg-cream px-4 py-3 text-sm text-charcoal placeholder:text-muted focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              disabled={state.status === 'loading'}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-terracotta px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-70"
            >
              {state.status === 'loading' && <Spinner className="size-4" />}
              Subscribe
            </button>
          </div>
          <p
            id="newsletter-feedback"
            aria-live="polite"
            className={`mt-2 min-h-5 text-xs ${state.status === 'error' ? 'text-red-200' : 'text-cream/85'}`}
          >
            {state.message}
          </p>
        </form>
      </div>
    </section>
  );
}
