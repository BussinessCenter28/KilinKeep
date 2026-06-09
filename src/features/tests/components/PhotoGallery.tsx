// Photo gallery for a test detail: resolves all photo paths to signed URLs in one
// batch and renders them in a grid, each with a remove control.
import type { TestPhoto } from '@/lib/types';
import { useMemo } from 'react';
import { Button, Spinner } from '@/components/ui';
import { useSignedUrls } from '../hooks/useSignedUrls';

interface Props {
  photos: TestPhoto[];
  onRemove: (photo: TestPhoto) => void;
  removing?: boolean;
}

export function PhotoGallery({ photos, onRemove, removing }: Props) {
  const paths = useMemo(() => photos.map((p) => p.storage_path), [photos]);
  const { data: urls, isLoading } = useSignedUrls(paths);

  if (photos.length === 0) return null;
  if (isLoading) return <Spinner label="Loading photos…" />;

  const map = urls ?? {};

  return (
    <div className="grid-2">
      {photos.map((photo) => {
        const url = map[photo.storage_path];
        return (
          <div key={photo.id}>
            {url ? (
              <img className="thumb" src={url} alt={`${photo.kind} firing`} loading="lazy" />
            ) : (
              <div className="thumb" aria-hidden style={{ display: 'grid', placeItems: 'center' }}>
                🖼️
              </div>
            )}
            <div className="spread" style={{ marginTop: 4 }}>
              <span className="muted small">
                {photo.kind}
                {photo.is_cover ? ' · cover' : ''}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(photo)} disabled={removing}>
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
