// Admin — owner-only INERT placeholder. The route is already guarded by <RequireOwner>,
// but that guard is only a display hint: real authorization happens server-side. The
// dashboards (overview, users, sales) will be read-only aggregates served by
// owner-verified admin Edge Functions, built later. This page issues NO data queries
// and imports neither '@/lib/supabase' nor any service.
import { Card, InfoBanner } from '@/components/ui';

const DASHBOARDS = [
  {
    icon: '📊',
    title: 'Overview',
    body: 'Headline counts — total users, tests logged, unlocks — at a glance.',
  },
  {
    icon: '👥',
    title: 'Users',
    body: 'Signups over time and plan mix. Aggregates only, never individual data.',
  },
  {
    icon: '💳',
    title: 'Sales',
    body: 'Unlocks, top-ups and tips, summed into revenue totals.',
  },
];

export function AdminPage() {
  return (
    <>
      <h1 className="page-title">Admin</h1>

      <InfoBanner>
        These dashboards are read-only aggregates served by owner-verified admin Edge
        Functions, built later. This screen makes no data queries yet — it is a preview
        of what will appear here.
      </InfoBanner>

      <div className="grid-2">
        {DASHBOARDS.map((d) => (
          <Card key={d.title}>
            <div style={{ fontSize: '1.5rem' }} aria-hidden>{d.icon}</div>
            <h3>{d.title}</h3>
            <p className="muted small">{d.body}</p>
          </Card>
        ))}
      </div>

      <p className="muted small">
        Authorization is enforced on the server: the admin Edge Functions verify the
        owner before returning any aggregate.
      </p>
    </>
  );
}
