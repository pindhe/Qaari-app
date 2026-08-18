import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("admin@moin.govsomaliland.org");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(identifier, password);
      setToken(data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Galitaanku wuu fashilmay");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="crest">SL</div>
        <p className="kicker">Jamhuuriyadda Somaliland</p>
        <h1>Qaari</h1>
        <p className="sub">Guddiga Maamulka · Wasaaradda Warfaafinta</p>
        <label htmlFor="id">Email</label>
        <input
          id="id"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <label htmlFor="pw">Erayga sirta</label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Sug..." : "Gal"}
        </button>
      </form>
    </div>
  );
}
