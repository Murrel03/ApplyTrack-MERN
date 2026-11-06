import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import StatsCards from '../components/StatsCards';
import PipelineBoard from '../components/PipelineBoard';
import ApplicationForm from '../components/ApplicationForm';

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/applications', { params: search ? { q: search } : {} }),
        api.get('/applications/stats'),
      ]);
      setApplications(appsRes.data.applications);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your applications.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(values) {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/applications/${editing._id}`, values);
      } else {
        await api.post('/applications', values);
      }
      setEditing(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the application.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(application, status) {
    // Optimistic update: move the card instantly, roll back if the API fails.
    const previous = applications;
    setApplications((list) => list.map((a) => (a._id === application._id ? { ...a, status } : a)));
    try {
      await api.put(`/applications/${application._id}`, { status });
      const statsRes = await api.get('/applications/stats');
      setStats(statsRes.data);
    } catch {
      setApplications(previous);
      setError('Could not update the status — change reverted.');
    }
  }

  async function handleDelete(application) {
    if (!window.confirm(`Delete the ${application.role} application at ${application.company}?`)) return;
    try {
      await api.delete(`/applications/${application._id}`);
      await load();
    } catch {
      setError('Could not delete the application.');
    }
  }

  function startEdit(application) {
    setEditing(application);
    setShowForm(true);
  }

  return (
    <main className="dashboard">
      <div className="dashboard-head">
        <div>
          <h2>Your pipeline</h2>
          <p className="muted">Every application, from “Applied” to “Offer”, in one place.</p>
        </div>
        <div className="dashboard-tools">
          <input
            className="search"
            type="search"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setShowForm((s) => !s);
            }}
          >
            {showForm && !editing ? 'Close' : '+ Add application'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <StatsCards stats={stats} />

      {showForm && (
        <ApplicationForm
          initial={editing}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {loading ? (
        <p className="muted">Loading your applications…</p>
      ) : (
        <PipelineBoard
          applications={applications}
          onEdit={startEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </main>
  );
}
