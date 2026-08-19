import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, setSession } from "../api";

export default function Settings() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [health, setHealth] = useState("Checking…");

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.ok ? "Online" : "Unavailable"))
      .catch(() => setHealth("Unavailable"));
  }, []);

  function signOut() {
    setSession(null);
    navigate("/login");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p className="lede">Staff account and system status for the Qaari admin panel.</p>
        </div>
      </div>

      <div className="workspace">
        <section className="card form-page">
          <h3>Staff account</h3>
          <label>Display name</label>
          <input value={user?.name ?? ""} readOnly />
          <label>Official email</label>
          <input value={user?.email ?? ""} readOnly />
          <label>Role</label>
          <input value="Administrator" readOnly />
          <p className="meta">Password changes are handled by the Ministry ICT department.</p>
          <button type="button" className="btn btn-danger" onClick={signOut}>
            Sign out
          </button>
        </section>

        <aside className="card side-panel">
          <h3>System</h3>
          <p>
            <strong>Language:</strong> English
          </p>
          <p>
            <strong>API:</strong> {health}
          </p>
          <p>
            <strong>App:</strong> Qaari Admin 1.0.0
          </p>
          <p className="hint">Republic of Somaliland · Ministry of Information, Culture and National Guidance</p>
        </aside>
      </div>
    </>
  );
}
