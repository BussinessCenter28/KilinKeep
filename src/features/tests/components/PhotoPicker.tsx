// File input → local preview → upload. The upload runs through a mutation passed in
// by the parent (which owns the testId/userId). Shows kind (before/after) + cover.
import { useEffect, useRef, useState } from 'react';
import type { PhotoKind } from '@/lib/types';
import { Button, ErrorBanner } from '@/components/ui';
import { SelectField } from '@/components/Field';
import { toFriendlyMessage } from '@/lib/errors';

interface Props {
  onUpload: (args: { file: File; kind: PhotoKind; isCover: boolean }) => Promise<unknown>;
  uploading?: boolean;
}

const KIND_OPTIONS: { value: PhotoKind; label: string }[] = [
  { value: 'after', label: 'After firing' },
  { value: 'before', label: 'Before firing' },
];

export function PhotoPicker({ onUpload, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<PhotoKind>('after');
  const [isCover, setIsCover] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manage the object URL lifecycle so we don't leak blobs.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async () => {
    if (!file) return;
    setError(null);
    try {
      await onUpload({ file, kind, isCover });
      reset();
    } catch (e) {
      setError(toFriendlyMessage(e));
    }
  };

  return (
    <div>
      {error ? <ErrorBanner message={error} /> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
        }}
      />
      {previewUrl ? (
        <div style={{ marginTop: 10 }}>
          <img className="thumb" src={previewUrl} alt="Preview" style={{ maxWidth: 160 }} />
          <SelectField
            label="Photo type"
            value={kind}
            options={KIND_OPTIONS}
            onChange={(e) => setKind(e.target.value as PhotoKind)}
          />
          <label className="row" style={{ marginBottom: 10 }}>
            <input type="checkbox" checked={isCover} onChange={(e) => setIsCover(e.target.checked)} />
            <span className="small">Use as cover photo</span>
          </label>
          <div className="row">
            <Button type="button" variant="primary" onClick={() => void submit()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload photo'}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={uploading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
