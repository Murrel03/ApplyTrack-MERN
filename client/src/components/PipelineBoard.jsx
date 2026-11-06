import { STATUSES, STATUS_COLORS } from '../constants';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Kanban-style view: one column per pipeline status, applications grouped
 * client-side from the flat list returned by the API.
 */
export default function PipelineBoard({ applications, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="board">
      {STATUSES.map((status) => {
        const items = applications.filter((a) => a.status === status);
        return (
          <section key={status} className="board-column">
            <h4 style={{ borderBottomColor: STATUS_COLORS[status] }}>
              {status} <span className="count">{items.length}</span>
            </h4>
            {items.length === 0 && <p className="empty">Nothing here yet</p>}
            {items.map((app) => (
              <article key={app._id} className="card">
                <strong>{app.company}</strong>
                <span className="card-role">{app.role}</span>
                <span className="card-meta">
                  {app.location ? `${app.location} · ` : ''}
                  {formatDate(app.appliedOn)}
                </span>
                {app.notes && <p className="card-notes">{app.notes}</p>}
                <div className="card-actions">
                  <select
                    aria-label={`Move ${app.company} to another stage`}
                    value={app.status}
                    onChange={(e) => onStatusChange(app, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => onEdit(app)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-small" onClick={() => onDelete(app)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
