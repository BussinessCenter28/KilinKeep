// Home: header, free-plan cap counter, search + tag filter, keyset list of TestCard
// with "Load more", and a FAB to create a new test.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { RESULT_TAGS } from '@/lib/types';
import { useAuth } from '@/features/auth/AuthContext';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, EmptyState, InfoBanner } from '@/components/ui';
import { TextField, SelectField } from '@/components/Field';
import { useTests } from '../hooks/useTests';
import { countMyTests } from '../services/testService';
import { TestCard } from '../components/TestCard';

const FREE_CAP = 10;

export function TestsListPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  const filters = useMemo(
    () => ({ search: search || undefined, tag: tag || undefined }),
    [search, tag],
  );

  const query = useTests(filters);
  const rows = useMemo(() => query.data?.pages.flatMap((p) => p.rows) ?? [], [query.data]);

  // Free-plan counter (server value; only used to show usage).
  const isFree = profile?.plan === 'free';
  const countQuery = useQuery({
    queryKey: [...qk.tests('count'), 'mine'],
    queryFn: () => countMyTests(),
    enabled: isFree,
  });
  const atCap = isFree && typeof countQuery.data === 'number' && countQuery.data >= FREE_CAP;

  return (
    <>
      <div className="spread">
        <h1 className="page-title">Tests</h1>
        {isFree && typeof countQuery.data === 'number' ? (
          <span className="muted small">{countQuery.data} of {FREE_CAP} tests used</span>
        ) : null}
      </div>

      {atCap ? (
        <InfoBanner>
          You’ve reached the free limit of {FREE_CAP} tests.{' '}
          <Link to="/billing">Unlock</Link> for unlimited tests.
        </InfoBanner>
      ) : null}

      <div className="grid-2">
        <TextField
          label="Search"
          value={searchInput}
          placeholder="Glaze, clay, notes…"
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setSearch(searchInput.trim());
          }}
          onBlur={() => setSearch(searchInput.trim())}
        />
        <SelectField
          label="Tag"
          value={tag}
          placeholder="All tags"
          options={RESULT_TAGS.map((t) => ({ value: t, label: t }))}
          onChange={(e) => setTag(e.target.value)}
        />
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        data={rows}
        isEmpty={(d) => d.length === 0}
        loadingLabel="Loading tests…"
        empty={
          <EmptyState icon="🧪" title="No tests yet">
            Log your first glaze test with the + button.
          </EmptyState>
        }
      >
        {(data) => (
          <>
            {data.map((t) => (
              <TestCard
                key={t.id}
                test={t}
                onClick={() => navigate(`/tests/${t.id}`)}
              />
            ))}
            {query.hasNextPage ? (
              <Button
                block
                variant="ghost"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            ) : null}
          </>
        )}
      </QueryBoundary>

      <button
        className="fab"
        aria-label={atCap ? 'Unlock to add more tests' : 'New test'}
        onClick={() => navigate(atCap ? '/billing' : '/tests/new')}
      >
        +
      </button>
    </>
  );
}
