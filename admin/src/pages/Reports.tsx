import { useEffect, useState } from "react";
import { api, type Qaari, type Stats } from "../api";
import { statusOf } from "../lib/status";
import BrandLogo from "../components/BrandLogo";

export default function Reports() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [qaaris, setQaaris] = useState<Qaari[]>([]);
  const [error, setError] = useState("");
  const generated = new Date().toLocaleString();

  useEffect(() => {
    Promise.all([api.stats(), api.qaaris()])
      .then(([s, q]) => {
        setStats(s.stats);
        setQaaris(q.qaaris);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  function downloadCsv() {
    const rows = [
      ["Name", "Status", "Juz uploaded", "Coverage %", "Bio"],
      ...qaaris.map((q) => [
        q.name,
        statusOf(q.uploadedJuzCount).label,
        String(q.uploadedJuzCount),
        String(Math.round((q.uploadedJuzCount / 30) * 100)),
        q.bio.replaceAll(",", ";"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qaari-library-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h2>Reports</h2>
          <p className="lede">Official library status report for Ministry records. Print or export as CSV.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={downloadCsv} disabled={!qaaris.length}>
            Export CSV
          </button>
          <button type="button" className="btn btn-primary inline" onClick={() => window.print()}>
            Print report
          </button>
        </div>
      </div>
      {error ? <div className="error no-print">{error}</div> : null}

      <section className="card report-sheet">
        <header className="report-head">
          <div className="report-brand">
            <BrandLogo variant="on-light" className="report-logo" />
            <div>
              <p className="kicker left">Ministry of Information</p>
              <h3>Qaari library status report</h3>
              <p className="meta">Generated {generated}</p>
            </div>
          </div>
          <div className="report-summary">
            <div>
              <b>{stats?.qaariCount ?? 0}</b>
              <span>Reciters</span>
            </div>
            <div>
              <b>{stats?.recordingCount ?? 0}</b>
              <span>Recordings</span>
            </div>
            <div>
              <b>{stats?.completeCount ?? 0}</b>
              <span>Complete</span>
            </div>
            <div>
              <b>{stats?.userCount ?? 0}</b>
              <span>Users</span>
            </div>
          </div>
        </header>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reciter</th>
                <th>Status</th>
                <th>Juz</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {qaaris.map((q) => {
                const st = statusOf(q.uploadedJuzCount);
                return (
                  <tr key={q.id}>
                    <td>
                      <strong>{q.name}</strong>
                    </td>
                    <td>{st.label}</td>
                    <td>
                      {q.uploadedJuzCount}/30
                    </td>
                    <td>{Math.round((q.uploadedJuzCount / 30) * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
