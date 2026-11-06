import { useEffect, useState } from 'react';
import { STATUSES } from '../constants';

const EMPTY = {
  company: '',
  role: '',
  status: 'Applied',
  location: '',
  jobUrl: '',
  appliedOn: new Date().toISOString().slice(0, 10),
  notes: '',
};

/**
 * Used for both "add" and "edit": pass an existing application to prefill it.
 * onSubmit receives the plain form values; the parent talks to the API.
 */
export default function ApplicationForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (initial) {
      setForm({
        company: initial.company || '',
        role: initial.role || '',
        status: initial.status || 'Applied',
        location: initial.location || '',
        jobUrl: initial.jobUrl || '',
        appliedOn: initial.appliedOn ? String(initial.appliedOn).slice(0, 10) : EMPTY.appliedOn,
        notes: initial.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="app-form" onSubmit={handleSubmit}>
      <h3>{initial ? 'Edit application' : 'Add application'}</h3>
      <div className="form-row">
        <label>
          Company *
          <input required value={form.company} onChange={update('company')} placeholder="e.g. Priceline" />
        </label>
        <label>
          Role *
          <input required value={form.role} onChange={update('role')} placeholder="e.g. Full Stack Developer" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Status
          <select value={form.status} onChange={update('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date applied
          <input type="date" value={form.appliedOn} onChange={update('appliedOn')} />
        </label>
        <label>
          Location
          <input value={form.location} onChange={update('location')} placeholder="e.g. Mumbai" />
        </label>
      </div>
      <label>
        Job URL
        <input type="url" value={form.jobUrl} onChange={update('jobUrl')} placeholder="https://…" />
      </label>
      <label>
        Notes
        <textarea rows="3" value={form.notes} onChange={update('notes')} placeholder="Recruiter name, follow-up date, referral…" />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add application'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
