import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredUser, setSession } from "../api";

function Icon({ d }: { d: string }) {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Emblem() {
  return (
    <svg className="side-emblem" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="42" fill="#042616" />
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

export default function Shell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = getStoredUser();
  const initials = (user?.name ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  function logout() {
    setSession(null);
    navigate("/login");
  }

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <div className="app-frame">
      <div className="flag-bar" aria-hidden="true" />
      {open ? <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <Emblem />
          <div>
            <div className="brand-mark">Qaari</div>
            <div className="brand-sub">Ministry of Information</div>
          </div>
        </div>

        <p className="sidebar-kicker">Main</p>
        <nav className="nav" onClick={() => setOpen(false)}>
          <NavLink to="/" end>
            <Icon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
            Dashboard
          </NavLink>
          <NavLink to="/qaaris">
            <Icon d="M8 7h13M8 12h13M8 17h13M4 7h.01M4 12h.01M4 17h.01" />
            Qaari
          </NavLink>
        </nav>

        <p className="sidebar-kicker">Insights</p>
        <nav className="nav" onClick={() => setOpen(false)}>
          <NavLink to="/analytics">
            <Icon d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8" />
            Analytics
          </NavLink>
          <NavLink to="/reports">
            <Icon d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M15 3v6h6" />
            Reports
          </NavLink>
        </nav>

        <p className="sidebar-kicker">System</p>
        <nav className="nav" onClick={() => setOpen(false)}>
          <NavLink to="/settings">
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.5-2-3.5-2.4.5a7 7 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A7 7 0 0 0 7 6L4.6 5.5l-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.5 7.7 7.7 0 0 0 .1 1.5l-2 1.5 2 3.5 2.4-.5a7 7 0 0 0 2.6 1.5L10 22h4l.4-2.5a7 7 0 0 0 2.6-1.5l2.4.5 2-3.5-2-1.5Z" />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <button type="button" className="side-btn primary" onClick={() => go("/qaaris/new")}>
            <Icon d="M12 5v14M5 12h14" />
            Add new Qaari
          </button>

          <div className="who-card">
            <div className="who-avatar">{initials}</div>
            <div className="who">
              <strong>{user?.name ?? "Administrator"}</strong>
              <span>{user?.email ?? "Official account"}</span>
            </div>
          </div>

          <button type="button" className="side-btn danger" onClick={logout}>
            <Icon d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="app-header">
          <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
          <div>
            <p className="kicker left">Republic of Somaliland</p>
            <h1 className="header-title">Official Recitation Library</h1>
          </div>
          <div className="header-meta">
            <span className="live-dot" />
            Live data
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
