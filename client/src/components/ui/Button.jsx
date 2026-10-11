import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-terracotta text-white hover:bg-terracotta-dark border border-terracotta hover:border-terracotta-dark',
  outline: 'border border-terracotta text-terracotta hover:bg-terracotta hover:text-white',
  forest: 'bg-forest text-cream hover:bg-forest-dark border border-forest',
  ghost: 'text-charcoal hover:bg-beige/50 border border-transparent',
  light: 'bg-cream text-charcoal border border-beige hover:border-terracotta hover:text-terracotta',
  danger: 'bg-red-700 text-white hover:bg-red-800 border border-red-700',
};

const sizes = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-3.5 text-sm',
};

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href || as === 'a') {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
