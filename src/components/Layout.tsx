// App shell: header + scrollable main + bottom tab nav. The owner-only admin link
// is shown by a display hint only; real authorization is server-side (Edge Functions).
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { env } from '@/lib/env';

const TABS = [
  { to: '/', label: 'Tests', icon: '🧪', end: true },
  { to: '/recipes', label: 'Recipes', icon: '📖', end: false },
  { to: '/firings', label: 'Firings', icon: '🔥', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
];

export function Layout() {
  const { user } = useAuth();
  const showAdmin = !!env.ownerUserId && user?.id === env.ownerUserId;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Kilnkeep</h1>
        {showAdmin ? <NavLink to="/admin" className="small">Admin</NavLink> : null}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-ico" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
