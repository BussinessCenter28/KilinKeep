// Presentational primitives. No data access, no business logic.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: '',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({ variant = 'secondary', block, size = 'md', className = '', ...rest }: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], block ? 'btn-block' : '', size === 'sm' ? 'btn-sm' : '', className]
    .filter(Boolean)
    .join(' ');
  return <button className={classes} {...rest} />;
}

export function Card({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const clickable = onClick ? 'clickable' : '';
  return (
    <div className={`card ${clickable} ${className}`.trim()} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="state">
      <span className="spinner" aria-hidden />
      {label ? <p className="muted small">{label}</p> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="banner banner-error" role="alert">{message}</div>;
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return <div className="banner banner-info">{children}</div>;
}

export function EmptyState({ icon, title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="state">
      {icon ? <div style={{ fontSize: '2rem' }}>{icon}</div> : null}
      <h3>{title}</h3>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  );
}

export function Stars({ rating }: { rating: number | null | undefined }) {
  if (!rating || rating < 1) return <span className="muted">—</span>;
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return <span className="stars" aria-label={`${n} of 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}
