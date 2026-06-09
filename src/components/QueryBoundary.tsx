// Renders the right state for a TanStack Query result: loading → error → empty → data.
// Keeps every data view consistent (mandate: loading/error/empty at every layer).
import type { ReactNode } from 'react';
import { Spinner, ErrorBanner, EmptyState } from './ui';
import { toFriendlyMessage } from '@/lib/errors';

interface Props<T> {
  isLoading: boolean;
  error: unknown;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  loadingLabel?: string;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({ isLoading, error, data, isEmpty, loadingLabel, empty, children }: Props<T>) {
  if (isLoading) return <Spinner label={loadingLabel} />;
  if (error) return <ErrorBanner message={toFriendlyMessage(error)} />;
  if (data === undefined) return <ErrorBanner message="No data." />;
  if (isEmpty?.(data)) {
    return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  }
  return <>{children(data)}</>;
}
