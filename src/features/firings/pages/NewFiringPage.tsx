// Create a firing, then navigate to its detail page. Errors surface via the form banner.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { toFriendlyMessage } from '@/lib/errors';
import { FiringForm } from '../components/FiringForm';
import { useFiringMutations } from '../hooks/useFiringMutations';
import type { FiringInput } from '../services/firingService';

export function NewFiringPage() {
  const navigate = useNavigate();
  const { create } = useFiringMutations();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: FiringInput) {
    setError(null);
    try {
      const firing = await create.mutateAsync(input);
      navigate(`/firings/${firing.id}`, { replace: true });
    } catch (err) {
      setError(toFriendlyMessage(err));
    }
  }

  return (
    <>
      <h1 className="page-title">New firing</h1>
      <Card>
        <FiringForm
          submitLabel="Create firing"
          busy={create.isPending}
          error={error}
          onSubmit={handleSubmit}
        />
      </Card>
    </>
  );
}
