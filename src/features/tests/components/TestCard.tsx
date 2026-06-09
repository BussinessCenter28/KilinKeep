// One row in the tests list. Presentational: takes a list row, renders a cover
// thumb (signed URL via hook), the glaze name, stars, tags and date.
import { Card, Stars } from '@/components/ui';
import { formatDate, truncate } from '@/lib/format';
import { useSignedUrl } from '../hooks/useSignedUrls';
import { coverPath, type TestListRow } from '../services/testService';

interface Props {
  test: TestListRow;
  onClick?: () => void;
}

export function TestCard({ test, onClick }: Props) {
  const cover = coverPath(test);
  const { data: coverUrl } = useSignedUrl(cover);

  const title = test.quick_glaze?.trim() || test.recipe?.name?.trim() || 'Untitled test';
  const tags = test.result_tags ?? [];

  return (
    <Card onClick={onClick}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 64, flex: '0 0 auto' }}>
          {coverUrl ? (
            <img className="thumb" src={coverUrl} alt="" loading="lazy" />
          ) : (
            <div className="thumb" aria-hidden style={{ display: 'grid', placeItems: 'center' }}>
              🧪
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="spread">
            <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </strong>
            <Stars rating={test.result_rating} />
          </div>
          {test.clay_body ? <div className="muted small">{truncate(test.clay_body, 40)}</div> : null}
          {tags.length > 0 ? (
            <div className="row wrap" style={{ marginTop: 6 }}>
              {tags.slice(0, 4).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <div className="muted small" style={{ marginTop: 6 }}>
            {formatDate(test.created_at)}
          </div>
        </div>
      </div>
    </Card>
  );
}
