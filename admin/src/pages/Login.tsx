import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api";

function Emblem() {
  return (
    <svg className="emblem" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="42" fill="#063820" />
      <circle cx="44" cy="44" r="36" fill="#0b7a3e" />
      <rect x="14" y="28" width="60" height="10" fill="#0b7a3e" />
      <rect x="14" y="38" width="60" height="12" fill="#ffffff" />
      <rect x="14" y="50" width="60" height="10" fill="#c8102e" />
      <polygon
        points="44,32 46.4,39.5 54.2,39.5 47.9,44.1 50.3,51.6 44,47 37.7,51.6 40.1,44.1 33.8,39.5 41.6,39.5"
        fill="#111"
      />
      <circle cx="44" cy="44" r="36" fill="none" stroke="#c9a227" strokeWidth="2.2" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(identifier, password);
      setSession(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="flag-bar" />
      <div className="login-split">
        <section className="login-brand" aria-label="Ministry">
          <div className="login-brand-inner">
            <Emblem />
            <p className="login-gov">Republic of Somaliland</p>
            <h1>Qaari</h1>
            <p className="login-ministry">
              Ministry of Information, Culture
              <br />
              and National Guidance
            </p>
            <ul className="login-points">
              <li>Manage official reciters</li>
              <li>Upload all 30 Juz recordings</li>
              <li>Serve the public iOS and Android apps</li>
            </ul>
          </div>
          <p className="login-brand-foot">Official system · Handle credentials with care</p>
        </section>

        <section className="login-panel">
          <form className="login-form" onSubmit={onSubmit}>
            <p className="kicker left">Staff access</p>
            <h2>Sign in to the admin panel</h2>
            <p className="lede">
              This portal is for Ministry staff only. The public should use the Qaari mobile app.
            </p>

            <label htmlFor="id">Official email</label>
            <div className="field">
              <span className="field-ico" aria-hidden="true">
                @
              </span>
              <input
                id="id"
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="name@moin.govsomaliland.org"
                required
              />
            </div>

            <label htmlFor="pw">Password</label>
            <div className="field">
              <span className="field-ico" aria-hidden="true">
                ⌁
              </span>
              <input
                id="pw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error ? (
              <div className="error" role="alert">
                {error}
              </div>
            ) : null}

            <button className="btn btn-primary login-submit" disabled={loading}>
              {loading ? "Checking..." : "Sign in"}
            </button>

            <p className="login-help">
              If you forgot your password, contact the Ministry ICT department.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
