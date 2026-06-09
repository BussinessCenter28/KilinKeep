import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TextField } from '@/components/Field';
import { Button, ErrorBanner, Card } from '@/components/ui';
import { signIn } from '../services/authService';
import { toFriendlyMessage } from '@/lib/errors';
import { useAuth } from '../AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <h1 className="page-title">Welcome back</h1>
        <Card>
          <form onSubmit={onSubmit}>
            {error ? <ErrorBanner message={error} /> : null}
            <TextField
              label="Email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="primary" block disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
        <p className="muted small" style={{ textAlign: 'center' }}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </main>
    </div>
  );
}
