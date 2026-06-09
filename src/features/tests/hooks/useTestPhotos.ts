// Photo mutations for a test: add (upload + insert row) and remove. Invalidates the
// test detail so the gallery refreshes.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import type { PhotoKind, TestPhoto } from '@/lib/types';
import { addPhoto, removeTestPhoto } from '../services/testService';

interface AddArgs {
  testId: string;
  userId: string;
  file: File;
  kind: PhotoKind;
  isCover: boolean;
}

export function useTestPhotos(testId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.test(testId) });
    void qc.invalidateQueries({ queryKey: ['tests'] });
  };

  const add = useMutation({
    mutationFn: (args: AddArgs) => addPhoto(args.testId, args.userId, args.file, args.kind, args.isCover),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (photo: TestPhoto) => removeTestPhoto(photo),
    onSuccess: invalidate,
  });

  return { add, remove };
}
