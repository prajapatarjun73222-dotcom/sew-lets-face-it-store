import { useState } from 'react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import { readJSON, writeJSON } from '../../utils/storage';

const PROMO_KEY = 'slfi_promo_v1';

export function readStoredPromo() {
  return readJSON(PROMO_KEY, null, sessionStorage);
}

export function writeStoredPromo(promo) {
  if (!promo) {
    try {
      sessionStorage.removeItem(PROMO_KEY);
    } catch {
      // ignore
    }
    return;
  }
  writeJSON(PROMO_KEY, promo, sessionStorage);
}

/** Round pounds the same way the server does (via pence). */
export function discountFromPercent(subtotal, percent) {
  return Math.round(Number(subtotal) * 100 * (Number(percent) / 100)) / 100;
}

export default function PromoCodeField({ applied, onApplied, onCleared }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async (event) => {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a promo code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/orders/validate-promo', { code: trimmed });
      const promo = { code: data.code, percent: data.percent, label: data.label };
      writeStoredPromo(promo);
      onApplied?.(promo);
      setCode('');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setError(fieldErrors.code || getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    writeStoredPromo(null);
    setCode('');
    setError('');
    onCleared?.();
  };

  if (applied?.code) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-forest/20 bg-forest/5 px-3 py-2.5 text-sm">
        <p>
          <span className="font-medium tracking-wide text-forest">{applied.code}</span>
          <span className="text-muted"> · {applied.label || `${applied.percent}% off`}</span>
        </p>
        <button type="button" onClick={clear} className="text-xs text-terracotta hover:underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-2" noValidate>
      <FormField label="Promo code" error={error}>
        {(props) => (
          <div className="flex gap-2">
            <input
              {...props}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              maxLength={20}
              autoComplete="off"
              className={`${props.className} min-w-0 flex-1 uppercase`}
              placeholder="e.g. SAVE10"
            />
            <Button type="submit" variant="light" size="sm" loading={loading} className="shrink-0 self-stretch">
              Apply
            </Button>
          </div>
        )}
      </FormField>
    </form>
  );
}
