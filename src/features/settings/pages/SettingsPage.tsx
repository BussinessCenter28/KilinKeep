import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, SelectField } from '@/components/Field';
import { Button, Card, ErrorBanner, InfoBanner, Spinner } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { signOut } from '@/features/auth/services/authService';
import { toFriendlyMessage } from '@/lib/errors';
import type { Units } from '@/lib/types';
import { useUpdatePrefs } from '../hooks/useUpdatePrefs';
import { exportMyData } from '../services/exportService';

const UNIT_OPTIONS: { value: Units; label: string }[] = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'oz', label: 'Ounces (oz)' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const updatePrefs = useUpdatePrefs();

  const [defaultCone, setDefaultCone] = useState(profile?.default_cone ?? '');
  const [units, setUnits] = useState<Units>(profile?.units ?? 'g');
  const [saved, setSaved] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (loading && !profile) return <Spinner label="Loading settings…" />;

  async function onSavePrefs(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    try {
      await updatePrefs.mutateAsync({ default_cone: defaultCone.trim(), units });
      setSaved(true);
    } catch {
      // Error surfaced from mutation.error below.
    }
  }

  async function onExport() {
    setExportError(null);
    setExporting(true);
    try {
      await exportMyData();
    } catch (err) {
      setExportError(toFriendlyMessage(err));
    } finally {
      setExporting(false);
    }
  }

  async function onSignOut() {
    setSignOutError(null);
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setSignOutError(toFriendlyMessage(err));
      setSigningOut(false);
    }
  }

  const isFree = profile?.plan === 'free';

  return (
    <>
      <h1 className="page-title">Settings</h1>

      <Card>
        <h3>Preferences</h3>
        <form onSubmit={onSavePrefs}>
          {updatePrefs.isError ? <ErrorBanner message={toFriendlyMessage(updatePrefs.error)} /> : null}
          {saved && !updatePrefs.isPending ? <InfoBanner>Preferences saved.</InfoBanner> : null}
          <TextField
            label="Default cone"
            placeholder="e.g. 6"
            value={defaultCone}
            onChange={(e) => {
              setDefaultCone(e.target.value);
              setSaved(false);
            }}
          />
          <SelectField
            label="Units"
            options={UNIT_OPTIONS}
            value={units}
            onChange={(e) => {
              setUnits(e.target.value as Units);
              setSaved(false);
            }}
          />
          <Button type="submit" variant="primary" disabled={updatePrefs.isPending}>
            {updatePrefs.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </Card>

      <Card>
        <h3>Plan</h3>
        {isFree ? (
          <>
            <p className="muted">You’re on the free plan.</p>
            <Link to="/billing">
              <Button variant="primary" block>Unlock everything — $9.99</Button>
            </Link>
          </>
        ) : (
          <>
            <p className="muted">You’re unlocked. Thanks for the support!</p>
            <p className="small">AI credits remaining: <strong>{profile?.ai_credits ?? 0}</strong></p>
          </>
        )}
      </Card>

      <Card>
        <h3>Export</h3>
        <p className="muted small">
          Download a JSON file of your recipes, firings, tests, and photo links.
        </p>
        {exportError ? <ErrorBanner message={exportError} /> : null}
        <Button onClick={onExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export my data'}
        </Button>
      </Card>

      <Card>
        <h3>Tip jar</h3>
        <p className="muted small">Kilnkeep is built by a potter, for potters.</p>
        <Link to="/billing">
          <Button variant="secondary">Buy me a coffee ☕</Button>
        </Link>
      </Card>

      <Card>
        {signOutError ? <ErrorBanner message={signOutError} /> : null}
        <Button variant="danger" block onClick={onSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </Card>
    </>
  );
}
