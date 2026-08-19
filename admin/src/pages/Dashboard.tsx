import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Qaari, type Stats } from "../api";

function statusOf(count: number) {
  if (count >= 30) return { label: "Complete", cls: "ok" };
  if (count > 0) return { label: "In progress", cls: "warn" };
  return { label: "Not started", cls: "idle" };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [qaaris, setQaaris] = useState<Qaari[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([api.stats(), api.qaaris()]);
      setStats(s.stats);
      setQaaris(q.qaaris);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return qaaris;
    return qaaris.filter((item) => item.name.toLowerCase().includes(q) || item.bio.toLowerCase().includes(q));
  }, [qaaris, query]);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}? All recordings for this reciter will be removed.`)) return;
    await api.deleteQaari(id);
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Reciter management</h2>
          <p className="lede">
            Official reciters, 30-Juz upload status, and public app usage — data is loaded live from the API.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
          <Link className="btn btn-primary inline" to="/qaaris/new">
            Add reciter
          </Link>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="stats">
        <article className="card stat">
          <span>Reciters</span>
          <b>{loading ? "…" : (stats?.qaariCount ?? 0)}</b>
          <small>{stats?.completeCount ?? 0} complete · {stats?.pendingJuz ?? 0} Juz still missing</small>
        </article>
        <article className="card stat">
          <span>Recordings (Juz)</span>
          <b>{loading ? "…" : (stats?.recordingCount ?? 0)}</b>
          <small>Audio files uploaded to the library</small>
        </article>
        <article className="card stat">
          <span>Users</span>
          <b>{loading ? "…" : (stats?.userCount ?? 0)}</b>
          <small>Public accounts (not staff)</small>
        </article>
        <article className="card stat">
          <span>Favorites</span>
          <b>{loading ? "…" : (stats?.favoriteCount ?? 0)}</b>
          <small>Saved reciters and Juz</small>
        </article>
      </div>

      <div className="workspace">
        <section className="card table-card">
          <div className="table-toolbar">
            <h3>Reciter registry</h3>
            <input
              className="search"
              placeholder="Search by name or bio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="empty">
              <strong>No reciters registered yet</strong>
              <p>Add a reciter so they appear in the mobile apps.</p>
              <Link className="btn btn-primary inline" to="/qaaris/new">
                Add the first reciter
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reciter</th>
                    <th>Status</th>
                    <th>Juz</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => {
                    const st = statusOf(q.uploadedJuzCount);
                    const pct = Math.round((q.uploadedJuzCount / 30) * 100);
                    return (
                      <tr key={q.id} onClick={() => navigate(`/qaaris/${q.id}`)}>
                        <td>
                          <div className="person">
                            {q.photoUrl ? (
                              <img src={q.photoUrl} alt="" />
                            ) : (
                              <div className="avatar">{q.name.slice(0, 1)}</div>
                            )}
                            <div>
                              <strong>{q.name}</strong>
                              <p>{q.bio}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </td>
                        <td>
                          <div className="progress-cell">
                            <div className="progress">
                              <i style={{ width: `${pct}%` }} />
                            </div>
                            <span>
                              {q.uploadedJuzCount}/30
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="row compact" onClick={(e) => e.stopPropagation()}>
                            <Link className="btn btn-ghost sm" to={`/qaaris/${q.id}`}>
                              View
                            </Link>
                            <Link className="btn btn-ghost sm" to={`/qaaris/${q.id}/edit`}>
                              Edit
                            </Link>
                            <button type="button" className="btn btn-danger sm" onClick={() => remove(q.id, q.name)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
          <div className="hint">These counts come from iOS and Android app users.</div>
        </aside>
      </div>
    </>
  );
}
