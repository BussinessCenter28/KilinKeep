// Admin — owner-only dashboards (overview, sales, users). The route is guarded by
// <RequireOwner> for UX, but real authorization is server-side in the admin-* Edge
// Functions. Read-only. Degrades gracefully when admin isn't enabled.
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, InfoBanner } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { functionErrorInfo } from '@/lib/functions';
import { useAdminOverview, useAdminSales, useAdminUsers } from '../hooks/useAdmin';
import type { AdminOverview } from '../services/adminService';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div className="muted small">{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
    </Card>
  );
}

export function AdminPage() {
  const overview = useAdminOverview();
  const sales = useAdminSales();
  const users = useAdminUsers();

  // If the overview call says the feature isn't enabled (or forbids us), show one
  // clear message rather than three error banners.
  const ovErr = overview.error ? functionErrorInfo(overview.error) : null;
  if (ovErr?.code === 'not_configured') {
    return (
      <>
        <h1 className="page-title">Admin</h1>
        <InfoBanner>Admin dashboards aren’t enabled yet (the owner id isn’t configured).</InfoBanner>
      </>
    );
  }
  if (ovErr?.code === 'forbidden') {
    return (
      <>
        <h1 className="page-title">Admin</h1>
        <InfoBanner>You don’t have access to the admin dashboards.</InfoBanner>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Admin</h1>

      <QueryBoundary<AdminOverview | undefined>
        isLoading={overview.isLoading}
        error={overview.error}
        data={overview.data}
        loadingLabel="Loading overview…"
      >
        {(o) =>
          o ? (
            <div className="grid-2">
              <Stat label="Users" value={o.users} />
              <Stat label="Unlocked" value={o.unlocked_users} />
              <Stat label="Tests" value={o.tests} />
              <Stat label="Recipes" value={o.recipes} />
              <Stat label="Firings" value={o.firings} />
              <Stat label="Revenue" value={formatMoney(o.revenue)} />
            </div>
          ) : null
        }
      </QueryBoundary>

      <h3>Sales</h3>
      <QueryBoundary
        isLoading={sales.isLoading}
        error={sales.error}
        data={sales.data}
        loadingLabel="Loading sales…"
      >
        {(s) => (
          <Card>
            <div className="spread">
              <span className="muted">Total revenue</span>
              <strong>{formatMoney(s.total_revenue)}</strong>
            </div>
            <div className="divider" />
            {Object.entries(s.by_type).map(([type, agg]) => (
              <div className="spread" key={type}>
                <span className="muted small">{type} ×{agg.count}</span>
                <span className="small">{formatMoney(agg.total)}</span>
              </div>
            ))}
            {s.recent.length === 0 ? <p className="muted small">No payments yet.</p> : null}
          </Card>
        )}
      </QueryBoundary>

      <h3>Users</h3>
      <QueryBoundary
        isLoading={users.isLoading}
        error={users.error}
        data={users.data}
        isEmpty={(d) => d.users.length === 0}
        loadingLabel="Loading users…"
        empty={<Card><p className="muted small">No users yet.</p></Card>}
      >
        {(d) => (
          <Card>
            <table className="batch-table">
              <thead>
                <tr><th>Plan</th><th className="num">Credits</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {d.users.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.plan}</td>
                    <td className="num">{u.ai_credits}</td>
                    <td>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </QueryBoundary>
    </>
  );
}
