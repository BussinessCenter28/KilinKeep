// Edit an existing test: load it, prefill the shared form, save the patch.
import { useNavigate, useParams } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { useTest } from '../hooks/useTest';
import { useTestMutations } from '../hooks/useTestMutations';
import { TestForm } from '../components/TestForm';
import type { CreateTestInput } from '../services/testService';

export function EditTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useTest(id);
  const { update } = useTestMutations();

  const handleSubmit = async (input: CreateTestInput) => {
    if (!id) return;
    await update.mutateAsync({ id, patch: input });
    navigate(`/tests/${id}`, { replace: true });
  };

  return (
    <>
      <h1 className="page-title">Edit test</h1>
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        data={query.data}
        isEmpty={(d) => d === null}
        loadingLabel="Loading test…"
      >
        {(test) =>
          test ? (
            <TestForm
              initial={test}
              submitLabel="Save changes"
              submitting={update.isPending}
              allowParent={false}
              onSubmit={handleSubmit}
            />
          ) : null
        }
      </QueryBoundary>
    </>
  );
}
