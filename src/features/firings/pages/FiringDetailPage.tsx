// Firing detail: read view with schedule table, plus inline edit and delete.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, Card } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { toFriendlyMessage } from '@/lib/errors';
import type { Firing, FiringSegment } from '@/lib/types';
import { useFiring } from '../hooks/useFirings';
import { useFiringMutations } from '../hooks/useFiringMutations';
import { FiringForm } from '../components/FiringForm';
import type { FiringInput } from '../services/firingService';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="spread">
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ScheduleTable({ schedule }: { schedule: FiringSegment[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Rate</th>
          <th>Temp</th>
          <th>Hold</th>
        </tr>
      </thead>
      <tbody>
        {schedule.map((seg, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{seg.rate ?? '—'}</td>
            <td>{seg.temp ?? '—'}</td>
            <td>{seg.hold ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FiringView({ firing, onEdit, onDelete, deleting }: {
  firing: Firing;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Card>
        <Detail label="Kiln" value={firing.kiln ?? '—'} />
        <Detail label="Date" value={formatDate(firing.date)} />
        <Detail label="Type" value={firing.type} />
        <Detail label="Target cone" value={firing.target_cone ?? '—'} />
        <Detail label="Atmosphere" value={firing.atmosphere ?? '—'} />
        <Detail label="Cost" value={formatMoney(firing.cost)} />
        {firing.notes ? (
          <>
            <div className="divider" />
            <p className="muted small">Notes</p>
            <p>{firing.notes}</p>
          </>
        ) : null}
      </Card>

      <Card>
        <p className="muted small">Schedule</p>
        {firing.schedule && firing.schedule.length > 0 ? (
          <ScheduleTable schedule={firing.schedule} />
        ) : (
          <p className="muted">No schedule recorded.</p>
        )}
      </Card>

      <div className="row wrap">
        <Button variant="primary" onClick={onEdit}>Edit</Button>
        {confirming ? (
          <>
            <Button variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
        )}
      </div>
    </>
  );
}

export function FiringDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useFiring(id);
  const { update, remove } = useFiringMutations();

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleUpdate(input: FiringInput) {
    if (!id) return;
    setFormError(null);
    try {
      await update.mutateAsync({ id, patch: input });
      setEditing(false);
    } catch (err) {
      setFormError(toFriendlyMessage(err));
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await remove.mutateAsync(id);
      navigate('/firings', { replace: true });
    } catch (err) {
      setFormError(toFriendlyMessage(err));
    }
  }

  return (
    <>
      <h1 className="page-title">{editing ? 'Edit firing' : 'Firing'}</h1>

      <QueryBoundary<Firing | null>
        isLoading={isLoading}
        error={error}
        data={data}
        isEmpty={(firing) => firing === null}
        loadingLabel="Loading firing…"
      >
        {(firing) => {
          if (!firing) return null;
          if (editing) {
            return (
              <Card>
                <FiringForm
                  initial={{
                    kiln: firing.kiln,
                    date: firing.date,
                    type: firing.type,
                    target_cone: firing.target_cone,
                    atmosphere: firing.atmosphere,
                    cost: firing.cost,
                    notes: firing.notes,
                    schedule: firing.schedule,
                  }}
                  submitLabel="Save changes"
                  busy={update.isPending}
                  error={formError}
                  onSubmit={handleUpdate}
                />
                <div className="row">
                  <Button variant="ghost" onClick={() => { setEditing(false); setFormError(null); }}>
                    Cancel
                  </Button>
                </div>
              </Card>
            );
          }
          return (
            <FiringView
              firing={firing}
              onEdit={() => setEditing(true)}
              onDelete={handleDelete}
              deleting={remove.isPending}
            />
          );
        }}
      </QueryBoundary>
    </>
  );
}
