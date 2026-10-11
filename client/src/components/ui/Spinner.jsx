import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'size-6', label }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <Loader2 className={`animate-spin ${className}`} aria-hidden />
      <span className={label ? 'text-sm text-muted' : 'sr-only'}>{label || 'Loading'}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-terracotta">
      <Spinner className="size-7" label={label} />
    </div>
  );
}
