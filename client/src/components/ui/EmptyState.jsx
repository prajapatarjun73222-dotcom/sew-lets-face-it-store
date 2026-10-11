export default function EmptyState({ icon: Icon, title, children, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
      {Icon && (
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-beige/60 text-terracotta">
          <Icon className="size-7" strokeWidth={1.4} aria-hidden />
        </span>
      )}
      <h2 className="text-3xl text-charcoal">{title}</h2>
      {children && <div className="mt-3 max-w-md text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
