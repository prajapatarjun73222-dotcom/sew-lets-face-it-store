import Modal from '../ui/Modal';
import Button from '../ui/Button';

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl text-charcoal">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-sm border border-beige bg-white ${className}`}>{children}</div>;
}

export function StatusBadge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-beige/70 text-charcoal',
    green: 'bg-forest/10 text-forest',
    amber: 'bg-amber-100 text-amber-900',
    red: 'bg-red-100 text-red-800',
    terracotta: 'bg-terracotta/10 text-terracotta-dark',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ConfirmDialog({ open, title, children, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="text-sm leading-relaxed text-charcoal/80">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="light" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-forest' : 'bg-beige-dark'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
        <span className="sr-only">{label}</span>
      </button>
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
