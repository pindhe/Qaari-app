import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Qaari, type Stats } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [qaaris, setQaaris] = useState<Qaari[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.stats(), api.qaaris()])
      .then(([s, q]) => {
        setStats(s.stats);
        setQaaris(q.qaaris);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const incomplete = qaaris.filter((q) => q.uploadedJuzCount < 30).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p className="lede">Live overview of the official recitation library and public app usage.</p>
        </div>
        <Link className="btn btn-primary inline" to="/qaaris/new">
          Add new Qaari
        </Link>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="stats">
        <article className="card stat">
          <span>Reciters</span>
          <b>{stats?.qaariCount ?? "…"}</b>
          <small>{stats?.completeCount ?? 0} complete sets</small>
        </article>
        <article className="card stat">
          <span>Recordings</span>
          <b>{stats?.recordingCount ?? "…"}</b>
          <small>{stats?.pendingJuz ?? 0} Juz still missing</small>
        </article>
        <article className="card stat">
          <span>Users</span>
          <b>{stats?.userCount ?? "…"}</b>
          <small>Public accounts</small>
        </article>
        <article className="card stat">
          <span>Favorites</span>
          <b>{stats?.favoriteCount ?? "…"}</b>
          <small>Saved in the mobile apps</small>
        </article>
      </div>

      <div className="workspace">
        <section className="card side-panel">
          <h3>Quick actions</h3>
          <div className="quick-grid">
            <Link className="quick-link" to="/qaaris">
              <strong>Qaari list</strong>
              <span>{qaaris.length} reciters · {incomplete} incomplete</span>
            </Link>
            <Link className="quick-link" to="/analytics">
              <strong>Analytics</strong>
              <span>Coverage and favorites</span>
            </Link>
            <Link className="quick-link" to="/reports">
              <strong>Reports</strong>
              <span>Export library status</span>
            </Link>
            <Link className="quick-link" to="/settings">
              <strong>Settings</strong>
              <span>Staff account and system</span>
            </Link>
          </div>
        </section>
        <aside className="card side-panel">
          <h3>Most favorited</h3>
          {stats?.mostFavorited?.length ? (
            <ol className="rank">
              {stats.mostFavorited.map((item, i) => (
                <li key={item.qaariId}>
                  <span className="rank-n">{i + 1}</span>
                  <Link to={`/qaaris/${item.qaariId}`}>{item.name}</Link>
                  <b>{item.favorites}</b>
                </li>
              ))}
            </ol>
          ) : (
            <p className="meta">No favorites yet.</p>
          )}
        </aside>
      </div>
    </>
  );
}
