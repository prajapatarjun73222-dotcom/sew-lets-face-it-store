import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const tones = {
  success: { cls: 'border-forest/25 bg-forest/5 text-forest', Icon: CheckCircle2 },
  error: { cls: 'border-red-200 bg-red-50 text-red-800', Icon: AlertCircle },
  info: { cls: 'border-beige-dark bg-beige/40 text-charcoal', Icon: Info },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertCircle },
};

export default function Alert({ type = 'info', title, children, className = '', action }) {
  const { cls, Icon } = tones[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-sm border px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
