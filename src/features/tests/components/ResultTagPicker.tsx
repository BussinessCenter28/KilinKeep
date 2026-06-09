// Toggle the well-known RESULT_TAGS, plus a free-form "add your own" input.
// Presentational and controlled — parent owns the selected list.
import { useState } from 'react';
import { RESULT_TAGS } from '@/lib/types';
import { Button } from '@/components/ui';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function ResultTagPicker({ value, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const addCustom = () => {
    const tag = draft.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  // Tags the user added that aren't part of the standard set.
  const custom = value.filter((t) => !RESULT_TAGS.includes(t as (typeof RESULT_TAGS)[number]));

  return (
    <div className="field">
      <label>Result tags</label>
      <div className="row wrap">
        {RESULT_TAGS.map((tag) => {
          const on = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`tag ${on ? '' : 'muted'}`.trim()}
              aria-pressed={on}
              onClick={() => toggle(tag)}
              style={{ border: 'none', cursor: 'pointer', opacity: on ? 1 : 0.55 }}
            >
              {on ? '✓ ' : ''}
              {tag}
            </button>
          );
        })}
        {custom.map((tag) => (
          <button
            key={tag}
            type="button"
            className="tag"
            aria-pressed
            onClick={() => toggle(tag)}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            ✓ {tag}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          value={draft}
          placeholder="Add a tag…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" size="sm" onClick={addCustom} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
