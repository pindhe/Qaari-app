import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Qaari, type Stats } from "../api";
import { statusOf } from "../lib/status";

export default function Analytics() {
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

  const coverage = stats && stats.qaariCount
    ? Math.round((stats.recordingCount / (stats.qaariCount * 30)) * 100)
    : 0;
  const maxFav = Math.max(1, ...(stats?.mostFavorited.map((m) => m.favorites) ?? [1]));

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Analytics</h2>
          <p className="lede">Library coverage, completion, and what the public is saving in the apps.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="stats">
        <article className="card stat">
          <span>Library coverage</span>
          <b>{coverage}%</b>
          <small>{stats?.recordingCount ?? 0} of {(stats?.qaariCount ?? 0) * 30} possible Juz</small>
        </article>
        <article className="card stat">
          <span>Complete reciters</span>
          <b>{stats?.completeCount ?? 0}</b>
          <small>All 30 Juz uploaded</small>
        </article>
        <article className="card stat">
          <span>Pending Juz</span>
          <b>{stats?.pendingJuz ?? 0}</b>
          <small>Still to be uploaded</small>
        </article>
        <article className="card stat">
          <span>Public favorites</span>
          <b>{stats?.favoriteCount ?? 0}</b>
          <small>{stats?.userCount ?? 0} registered listeners</small>
        </article>
      </div>

      <div className="workspace">
        <section className="card side-panel">
          <h3>Juz completion by reciter</h3>
          <div className="bars">
            {qaaris.map((q) => {
              const pct = Math.round((q.uploadedJuzCount / 30) * 100);
              const st = statusOf(q.uploadedJuzCount);
              return (
                <Link key={q.id} className="bar-row" to={`/qaaris/${q.id}`}>
                  <span className="bar-label">{q.name}</span>
                  <div className="progress">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`badge ${st.cls}`}>{q.uploadedJuzCount}/30</span>
                </Link>
              );
            })}
          </div>
        </section>
        <aside className="card side-panel">
          <h3>Favorite ranking</h3>
          <div className="bars">
            {(stats?.mostFavorited ?? []).map((item) => (
              <Link key={item.qaariId} className="bar-row" to={`/qaaris/${item.qaariId}`}>
                <span className="bar-label">{item.name}</span>
                <div className="progress">
                  <i style={{ width: `${(item.favorites / maxFav) * 100}%` }} />
                </div>
                <b>{item.favorites}</b>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
