// Small pure formatting helpers shared across features.

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMoney(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function ratingStars(rating: number | null | undefined): string {
  if (!rating || rating < 1) return '—';
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/** Truncate for list previews without breaking layout. */
export function truncate(text: string | null | undefined, max = 80): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
