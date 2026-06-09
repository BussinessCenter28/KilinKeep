// Horizontal scroll of a test's lineage: ancestors → current → children. The current
// node is highlighted. Presentational; parent supplies the resolved lineage.
import { Link } from 'react-router-dom';
import type { Test } from '@/lib/types';
import { formatDate } from '@/lib/format';

interface Props {
  ancestors: Test[];
  current: Test;
  children: Test[];
}

function label(t: Test): string {
  return t.quick_glaze?.trim() || 'Recipe test';
}

function Node({ test, current }: { test: Test; current?: boolean }) {
  const body = (
    <>
      <div className="small" style={{ fontWeight: 600 }}>
        {label(test)}
      </div>
      <div className="muted small">{formatDate(test.created_at)}</div>
      {test.change_note ? <div className="muted small">{test.change_note}</div> : null}
    </>
  );
  if (current) {
    return <div className="lineage-node current">{body}</div>;
  }
  return (
    <Link to={`/tests/${test.id}`} className="lineage-node" style={{ textDecoration: 'none', color: 'inherit' }}>
      {body}
    </Link>
  );
}

export function LineageStrip({ ancestors, current, children }: Props) {
  if (ancestors.length === 0 && children.length === 0) return null;
  return (
    <div className="lineage-strip" aria-label="Test lineage">
      {ancestors.map((t) => (
        <Node key={t.id} test={t} />
      ))}
      <Node test={current} current />
      {children.map((t) => (
        <Node key={t.id} test={t} />
      ))}
    </div>
  );
}
