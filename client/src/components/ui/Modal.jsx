import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-charcoal/50" onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full ${maxWidth} animate-fade-in overflow-y-auto rounded-t-md bg-cream shadow-2xl focus:outline-none sm:rounded-sm`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-beige bg-cream px-6 py-4">
          <h2 className="text-2xl text-charcoal">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-beige/60 hover:text-charcoal">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
