// Create a new test. We save the row first (so it gets an id), then route to its
// detail page where photos can be attached against that id.
import { useNavigate } from 'react-router-dom';
import { TestForm } from '../components/TestForm';
import { useTestMutations } from '../hooks/useTestMutations';
import type { CreateTestInput } from '../services/testService';

export function NewTestPage() {
  const navigate = useNavigate();
  const { create } = useTestMutations();

  const handleSubmit = async (input: CreateTestInput) => {
    const test = await create.mutateAsync(input);
    navigate(`/tests/${test.id}`, { replace: true });
  };

  return (
    <>
      <h1 className="page-title">New test</h1>
      <TestForm submitLabel="Save test" submitting={create.isPending} onSubmit={handleSubmit} />
    </>
  );
}
