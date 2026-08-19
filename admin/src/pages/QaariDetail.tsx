import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Qaari, type Recording } from "../api";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function QaariDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qaari, setQaari] = useState<Qaari | null>(null);
  const [juzNumber, setJuzNumber] = useState(1);
  const [audio, setAudio] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    const { qaari: next } = await api.qaari(id);
    setQaari(next);
    const missing = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (n) => !next.recordings?.some((r) => r.juzNumber === n),
    );
    if (missing) setJuzNumber(missing);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [id]);

  const byJuz = useMemo(() => {
    const map = new Map<number, Recording>();
    qaari?.recordings?.forEach((r) => map.set(r.juzNumber, r));
    return map;
  }, [qaari]);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!id || !audio) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("juzNumber", String(juzNumber));
      form.set("audio", audio);
      await api.uploadJuz(id, form);
      setAudio(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecording(recId: string) {
    if (!confirm("Delete this recording?")) return;
    await api.deleteRecording(recId);
    await refresh();
  }

  async function removeQaari() {
    if (!id || !confirm("Deleting this reciter will remove all 30 Juz recordings.")) return;
    await api.deleteQaari(id);
    navigate("/");
  }

  if (!qaari) {
    return (
      <div>
        <Link className="crumb" to="/">
          ← Dashboard
        </Link>
        <p>{error || "Loading live data..."}</p>
      </div>
    );
  }

  const pct = Math.round((qaari.uploadedJuzCount / 30) * 100);

  return (
    <>
      <Link className="crumb" to="/">
        ← Reciters
      </Link>
      <section className="card profile-hero">
        {qaari.photoUrl ? <img src={qaari.photoUrl} alt={qaari.name} /> : <div className="detail-photo" />}
        <div>
          <p className="kicker left">Official reciter</p>
          <h2>{qaari.name}</h2>
          <p className="lede">{qaari.bio}</p>
          <div className="progress-cell wide">
            <div className="progress lg">
              <i style={{ width: `${pct}%` }} />
            </div>
            <span>
              {qaari.uploadedJuzCount} / 30 Juz ({pct}%)
            </span>
          </div>
          <div className="row">
            <Link className="btn btn-ghost" to={`/qaaris/${qaari.id}/edit`}>
              Edit profile
            </Link>
            <button className="btn btn-danger" type="button" onClick={removeQaari}>
              Delete reciter
            </button>
          </div>
        </div>
      </section>

      <h3 className="section-title">Upload or replace a Juz</h3>
      <form className="card form-page upload-bar" onSubmit={upload}>
        <label>
          Juz number
          <select value={juzNumber} onChange={(e) => setJuzNumber(Number(e.target.value))}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Juz {n} {byJuz.has(n) ? "— can be replaced" : "— new"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Audio file (AAC / MP3 / M4A)
          <input
            type="file"
            accept="audio/mpeg,audio/aac,audio/mp4,audio/m4a,audio/x-m4a,audio/wav"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <button className="btn btn-primary inline" disabled={busy || !audio}>
          {busy ? "Uploading..." : byJuz.has(juzNumber) ? "Replace" : "Upload"}
        </button>
      </form>
      {error ? <div className="error">{error}</div> : null}

      <div className="juz-grid">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
          const rec = byJuz.get(n);
          return (
            <div key={n} className={`juz ${rec ? "ready" : ""}`}>
              <strong>Juz {n}</strong>
              {rec ? (
                <>
                  <div className="file">{formatDuration(rec.durationSeconds)}</div>
                  <div className="row compact">
                    <button
                      type="button"
                      className="btn btn-ghost sm"
                      onClick={() => {
                        const el = document.getElementById(`audio-${rec.id}`) as HTMLAudioElement | null;
                        if (!el) return;
                        if (playing === rec.id) {
                          el.pause();
                          setPlaying(null);
                        } else {
                          document.querySelectorAll("audio").forEach((a) => a.pause());
                          el.play();
                          setPlaying(rec.id);
                        }
                      }}
                    >
                      {playing === rec.id ? "Pause" : "Play"}
                    </button>
                    <button type="button" className="btn btn-danger sm" onClick={() => removeRecording(rec.id)}>
                      Delete
                    </button>
                  </div>
                  <audio id={`audio-${rec.id}`} src={rec.audioUrl} preload="none" onEnded={() => setPlaying(null)} />
                </>
              ) : (
                <div className="file">Not uploaded</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
