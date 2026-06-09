// Shared create/edit form. Glaze source is XOR: pick a saved recipe OR type a quick
// glaze (the UI enforces it — picking one clears the other). Also: firing, parent
// test, clay body, cone, atmosphere, application, rating, tags, notes, change note.
import { useMemo, useState, type FormEvent } from 'react';
import type { Test } from '@/lib/types';
import { ATMOSPHERES, APPLICATIONS } from '@/lib/types';
import { TextField, TextArea, SelectField } from '@/components/Field';
import { Button, ErrorBanner, InfoBanner, Spinner } from '@/components/ui';
import { toFriendlyMessage } from '@/lib/errors';
import type { CreateTestInput } from '../services/testService';
import { useRecipeOptions, useFiringOptions, useParentTestOptions } from '../hooks/useTestFormData';
import { RatingInput } from './RatingInput';
import { ResultTagPicker } from './ResultTagPicker';

type GlazeMode = 'recipe' | 'quick';

interface Props {
  initial?: Test;
  submitLabel: string;
  submitting?: boolean;
  // Hide the parent picker on edit (lineage shouldn't be rewired here).
  allowParent?: boolean;
  onSubmit: (input: CreateTestInput) => Promise<void>;
}

function asOption<T extends string>(values: readonly T[]) {
  return values.map((v) => ({ value: v, label: v }));
}

export function TestForm({ initial, submitLabel, submitting, allowParent = true, onSubmit }: Props) {
  const recipes = useRecipeOptions();
  const firings = useFiringOptions();
  const parents = useParentTestOptions();

  const [glazeMode, setGlazeMode] = useState<GlazeMode>(initial?.recipe_id ? 'recipe' : 'quick');
  const [recipeId, setRecipeId] = useState(initial?.recipe_id ?? '');
  const [quickGlaze, setQuickGlaze] = useState(initial?.quick_glaze ?? '');
  const [parentId, setParentId] = useState(initial?.parent_test_id ?? '');
  const [changeNote, setChangeNote] = useState(initial?.change_note ?? '');
  const [firingId, setFiringId] = useState(initial?.firing_id ?? '');
  const [clayBody, setClayBody] = useState(initial?.clay_body ?? '');
  const [cone, setCone] = useState(initial?.cone ?? '');
  const [atmosphere, setAtmosphere] = useState<string>(initial?.atmosphere ?? '');
  const [application, setApplication] = useState<string>(initial?.application ?? '');
  const [rating, setRating] = useState<number | null>(initial?.result_rating ?? null);
  const [tags, setTags] = useState<string[]>(initial?.result_tags ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const recipeOptions = useMemo(
    () => (recipes.data ?? []).map((r) => ({ value: r.id, label: r.name })),
    [recipes.data],
  );
  const firingOptions = useMemo(
    () =>
      (firings.data ?? []).map((f) => ({
        value: f.id,
        label: [f.kiln ?? 'Firing', f.target_cone ? `cone ${f.target_cone}` : null]
          .filter(Boolean)
          .join(' · '),
      })),
    [firings.data],
  );
  const parentOptions = useMemo(
    () =>
      (parents.data?.rows ?? [])
        .filter((t) => t.id !== initial?.id)
        .map((t) => ({ value: t.id, label: t.quick_glaze?.trim() || 'Recipe test' })),
    [parents.data, initial?.id],
  );

  const xorOk =
    glazeMode === 'recipe' ? !!recipeId : quickGlaze.trim().length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!xorOk) {
      setFormError(
        glazeMode === 'recipe'
          ? 'Pick a saved recipe, or switch to a quick glaze.'
          : 'Enter a quick glaze name, or switch to a saved recipe.',
      );
      return;
    }

    const input: CreateTestInput = {
      recipe_id: glazeMode === 'recipe' ? recipeId : null,
      quick_glaze: glazeMode === 'quick' ? quickGlaze.trim() : null,
      parent_test_id: allowParent && parentId ? parentId : initial?.parent_test_id ?? null,
      change_note: parentId || initial?.parent_test_id ? changeNote.trim() || null : null,
      firing_id: firingId || null,
      clay_body: clayBody.trim() || null,
      cone: cone.trim() || null,
      atmosphere: atmosphere ? (atmosphere as Test['atmosphere']) : null,
      application: application ? (application as Test['application']) : null,
      result_rating: rating,
      result_tags: tags,
      notes: notes.trim() || null,
    };

    try {
      await onSubmit(input);
    } catch (err) {
      setFormError(toFriendlyMessage(err));
    }
  };

  const showChangeNote = allowParent ? !!parentId : !!initial?.parent_test_id;

  return (
    <form onSubmit={submit}>
      {formError ? <ErrorBanner message={formError} /> : null}

      <SelectField
        label="Glaze source"
        value={glazeMode}
        options={[
          { value: 'quick', label: 'Quick glaze (type a name)' },
          { value: 'recipe', label: 'Saved recipe' },
        ]}
        onChange={(e) => {
          const next = e.target.value as GlazeMode;
          setGlazeMode(next);
          // Clear the inactive side so only the chosen source ever holds a value.
          if (next === 'recipe') setQuickGlaze('');
          else setRecipeId('');
        }}
      />

      {glazeMode === 'recipe' ? (
        recipes.isLoading ? (
          <Spinner label="Loading recipes…" />
        ) : recipeOptions.length === 0 ? (
          <InfoBanner>No saved recipes yet — switch to a quick glaze.</InfoBanner>
        ) : (
          <SelectField
            label="Recipe"
            value={recipeId}
            placeholder="Choose a recipe…"
            options={recipeOptions}
            onChange={(e) => setRecipeId(e.target.value)}
          />
        )
      ) : (
        <TextField
          label="Quick glaze"
          value={quickGlaze}
          placeholder="e.g. Tenmoku over white"
          onChange={(e) => setQuickGlaze(e.target.value)}
        />
      )}

      <div className="divider" />

      <TextField
        label="Clay body"
        value={clayBody}
        placeholder="e.g. B-Mix 5"
        onChange={(e) => setClayBody(e.target.value)}
      />
      <div className="grid-2">
        <TextField label="Cone" value={cone} placeholder="e.g. 6" onChange={(e) => setCone(e.target.value)} />
        <SelectField
          label="Application"
          value={application}
          placeholder="—"
          options={asOption(APPLICATIONS)}
          onChange={(e) => setApplication(e.target.value)}
        />
      </div>
      <div className="grid-2">
        <SelectField
          label="Atmosphere"
          value={atmosphere}
          placeholder="—"
          options={asOption(ATMOSPHERES)}
          onChange={(e) => setAtmosphere(e.target.value)}
        />
        <SelectField
          label="Firing"
          value={firingId}
          placeholder={firings.isLoading ? 'Loading…' : 'None'}
          options={firingOptions}
          onChange={(e) => setFiringId(e.target.value)}
        />
      </div>

      {allowParent ? (
        <SelectField
          label="Iterating on (parent test)"
          value={parentId}
          placeholder="None — this is a new test"
          options={parentOptions}
          onChange={(e) => setParentId(e.target.value)}
        />
      ) : null}
      {showChangeNote ? (
        <TextField
          label="What changed?"
          value={changeNote}
          placeholder="e.g. Added 2% red iron oxide"
          onChange={(e) => setChangeNote(e.target.value)}
        />
      ) : null}

      <div className="divider" />

      <RatingInput value={rating} onChange={setRating} />
      <ResultTagPicker value={tags} onChange={setTags} />
      <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <Button type="submit" variant="primary" block disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
