import { STATUSES, STATUS_COLORS } from '../constants';

export default function StatsCards({ stats }) {
  if (!stats) return null;
  return (
    <section className="stats-grid">
      <article className="stat-card stat-total">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total applications</span>
      </article>
      {STATUSES.map((status) => (
        <article key={status} className="stat-card" style={{ borderTopColor: STATUS_COLORS[status] }}>
          <span className="stat-value">{stats.byStatus[status] ?? 0}</span>
          <span className="stat-label">{status}</span>
        </article>
      ))}
      <article className="stat-card stat-rate">
        <span className="stat-value">{stats.responseRate}%</span>
        <span className="stat-label">Moved past “Applied”</span>
      </article>
    </section>
  );
}
