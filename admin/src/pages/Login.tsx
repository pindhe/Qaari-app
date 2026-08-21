import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api";
import BrandLogo from "../components/BrandLogo";

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
          <BrandLogo variant="on-dark" className="login-watermark" alt="" aria-hidden="true" />
          <div className="login-brand-inner">
            <BrandLogo variant="on-dark" className="emblem" />
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
            <BrandLogo variant="on-light" className="login-form-logo" />
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
