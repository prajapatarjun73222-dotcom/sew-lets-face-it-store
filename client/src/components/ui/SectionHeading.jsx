import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeading({ eyebrow, title, subtitle, linkTo, linkLabel, align = 'left', className = '' }) {
  const centered = align === 'center';
  return (
    <div
      className={`mb-8 flex flex-col gap-4 sm:mb-10 ${centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'} ${className}`}
    >
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl text-charcoal sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-dark"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
