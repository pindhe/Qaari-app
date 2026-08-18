import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken, type Qaari, type Stats } from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
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

  function logout() {
    setToken(null);
    navigate("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">Qaari</div>
          <div className="brand-sub">Wasaaradda Warfaafinta</div>
        </div>
        <nav className="nav">
          <Link className="active" to="/">
            Qaariyada
          </Link>
          <button type="button" onClick={logout}>
            Ka bax
          </button>
        </nav>
      </aside>
      <main className="content">
        <div className="topbar">
          <div>
            <p className="kicker" style={{ textAlign: "left" }}>
              Guddiga Maamulka
            </p>
            <h1>Maamulka Qaariyada</h1>
          </div>
          <Link className="btn btn-primary" to="/qaaris/new" style={{ width: "auto" }}>
            Ku dar Qaari
          </Link>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="stats">
          <div className="card stat">
            <b>{stats?.qaariCount ?? "—"}</b>
            <span>Qaari</span>
          </div>
          <div className="card stat">
            <b>{stats?.recordingCount ?? "—"}</b>
            <span>Dhageysiyo (Juz)</span>
          </div>
          <div className="card stat">
            <b>{stats?.userCount ?? "—"}</b>
            <span>Isticmaalayaal</span>
          </div>
          <div className="card stat">
            <b>{stats?.favoriteCount ?? "—"}</b>
            <span>Kuwa la jecelyahay</span>
          </div>
        </div>

        <div className="qaari-grid">
          {qaaris.map((q) => (
            <Link key={q.id} className="card qaari-card" to={`/qaaris/${q.id}`}>
              {q.photoUrl ? (
                <img src={q.photoUrl} alt={q.name} />
              ) : (
                <div className="photo-fallback">{q.name.slice(0, 1)}</div>
              )}
              <div className="body">
                <h3>{q.name}</h3>
                <div className="meta">
                  {q.uploadedJuzCount} / 30 Juz ayaa la soo geliyey
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
