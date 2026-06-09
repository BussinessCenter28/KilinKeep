import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { TextField } from '@/components/Field';
import { Button, ErrorBanner, InfoBanner, Card } from '@/components/ui';
import { signUp } from '../services/authService';
import { toFriendlyMessage } from '@/lib/errors';
import { useAuth } from '../AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      // If email confirmation is on, there is no session yet — tell the user.
      setNeedsConfirm(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <h1 className="page-title">Create your account</h1>
        <Card>
          {needsConfirm ? (
            <InfoBanner>Check your email to confirm your account, then sign in.</InfoBanner>
          ) : (
            <form onSubmit={onSubmit}>
              {error ? <ErrorBanner message={error} /> : null}
              <TextField
                label="Email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password" type="password" autoComplete="new-password" required
                hint="At least 8 characters."
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" variant="primary" block disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </Button>
            </form>
          )}
        </Card>
        <p className="muted small" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="muted small" style={{ textAlign: 'center' }}>
          Free for your first 10 tests. One-time unlock for unlimited + the Assistant.
        </p>
      </main>
    </div>
  );
}
