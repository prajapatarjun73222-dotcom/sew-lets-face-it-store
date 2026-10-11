import { useId } from 'react';

export default function FormField({ label, error, hint, required, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-terracotta">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, className: `input ${error ? 'input-error' : ''}` })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
