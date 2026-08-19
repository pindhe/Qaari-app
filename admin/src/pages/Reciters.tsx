import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Qaari } from "../api";
import { statusOf } from "../lib/status";

export default function Reciters() {
  const navigate = useNavigate();
  const [qaaris, setQaaris] = useState<Qaari[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { qaaris: list } = await api.qaaris();
      setQaaris(list);
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
          <h2>Qaari</h2>
          <p className="lede">Official reciter registry. Add a new Qaari or open a profile to upload Juz recordings.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
          <Link className="btn btn-primary inline" to="/qaaris/new">
            Add new Qaari
          </Link>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <section className="card table-card">
        <div className="table-toolbar">
          <h3>
            Reciters <span className="count-pill">{qaaris.length}</span>
          </h3>
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
            <p>Add a Qaari so they appear in the mobile apps.</p>
            <Link className="btn btn-primary inline" to="/qaaris/new">
              Add new Qaari
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
    </>
  );
}
