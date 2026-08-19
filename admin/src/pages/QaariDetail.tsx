import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Qaari, type Recording } from "../api";
import { statusOf } from "../lib/status";

const AUDIO_ACCEPT = "audio/mpeg,audio/aac,audio/mp4,audio/m4a,audio/x-m4a,audio/wav,audio/ogg";
const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg)$/i.test(file.name);
}

type Filter = "all" | "ready" | "missing";

export default function QaariDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const justRegistered = params.get("registered") === "1";
  const [qaari, setQaari] = useState<Qaari | null>(null);
  const [juzNumber, setJuzNumber] = useState(1);
  const [audio, setAudio] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [drag, setDrag] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLAudioElement>(null);

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
    refresh().catch((err: Error) => {
      setError(err.message);
      if (/not found/i.test(err.message)) setNotFound(true);
    });
  }, [id]);

  const byJuz = useMemo(() => {
    const map = new Map<number, Recording>();
    qaari?.recordings?.forEach((r) => map.set(r.juzNumber, r));
    return map;
  }, [qaari]);

  const missingCount = 30 - (qaari?.uploadedJuzCount ?? 0);
  const totalSeconds = qaari?.recordings?.reduce((sum, rec) => sum + (rec.durationSeconds ?? 0), 0) ?? 0;
  const selectedReady = byJuz.has(juzNumber);

  const visibleJuz = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => i + 1).filter((n) => {
      if (filter === "ready") return byJuz.has(n);
      if (filter === "missing") return !byJuz.has(n);
      return true;
    });
  }, [filter, byJuz]);

  function stopPlayback() {
    playerRef.current?.pause();
    setPlaying(null);
  }

  function applyAudio(file: File | null) {
    if (!file) {
      setAudio(null);
      return;
    }
    if (!isAudioFile(file)) {
      setError("Audio must be MP3, AAC, M4A, WAV, or OGG.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("The audio file must be 80 MB or smaller.");
      return;
    }
    setError("");
    setNotice("");
    setAudio(file);
  }

  function onDrop(e: DragEvent, juz?: number) {
    e.preventDefault();
    setDrag(false);
    if (juz) setJuzNumber(juz);
    applyAudio(e.dataTransfer.files?.[0] ?? null);
  }

  async function upload(e?: FormEvent) {
    e?.preventDefault();
    if (!id || !audio) return;
    setBusy(true);
    setError("");
    setNotice("");
    stopPlayback();
    try {
      const form = new FormData();
      form.set("juzNumber", String(juzNumber));
      form.set("audio", audio);
      await api.uploadJuz(id, form);
      setAudio(null);
      if (fileRef.current) fileRef.current.value = "";
      setNotice(`Juz ${juzNumber} is now in the library.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function togglePlay(rec: Recording) {
    const el = playerRef.current;
    if (!el) return;
    if (playing === rec.id) {
      el.pause();
      setPlaying(null);
      return;
    }
    el.src = rec.audioUrl;
    void el.play();
    setPlaying(rec.id);
  }

  async function removeRecording(recId: string, n: number) {
    if (!confirm(`Delete the recording for Juz ${n}?`)) return;
    if (playing === recId) stopPlayback();
    await api.deleteRecording(recId);
    setNotice(`Juz ${n} was removed.`);
    await refresh();
  }

  async function removeQaari() {
    if (!id || !confirm("Deleting this reciter will remove all 30 Juz recordings.")) return;
    stopPlayback();
    await api.deleteQaari(id);
    navigate("/qaaris");
  }

  if (notFound) {
    return (
      <>
        <Link className="crumb" to="/qaaris">
          ← Back to Qaari list
        </Link>
        <div className="card empty">
          <strong>Reciter not found</strong>
          <p>This profile may have been deleted.</p>
          <Link className="btn btn-primary inline" to="/qaaris">
            Open Qaari list
          </Link>
        </div>
      </>
    );
  }

  if (!qaari) {
    return (
      <>
        <Link className="crumb" to="/qaaris">
          ← Back to Qaari list
        </Link>
        <p>{error || "Loading live data..."}</p>
      </>
    );
  }

  const pct = Math.round((qaari.uploadedJuzCount / 30) * 100);
  const st = statusOf(qaari.uploadedJuzCount);

  return (
    <>
      <Link className="crumb" to="/qaaris">
        ← Back to Qaari list
      </Link>

      <div className="page-head">
        <div>
          <h2>{qaari.name}</h2>
          <p className="lede">Official library profile. Upload or replace Juz recordings for the public apps.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-ghost" to={`/qaaris/${qaari.id}/edit`}>
            Edit profile
          </Link>
          <button className="btn btn-danger" type="button" onClick={removeQaari}>
            Delete reciter
          </button>
        </div>
      </div>

      {justRegistered || notice ? (
        <div className="notice">
          {justRegistered && !notice
            ? "Profile saved. Upload the 30 Juz so this reciter appears complete in the public apps."
            : notice}
        </div>
      ) : null}

      <section className="card profile-hero">
        {qaari.photoUrl ? (
          <img src={qaari.photoUrl} alt={qaari.name} />
        ) : (
          <div className="detail-photo">{qaari.name.slice(0, 1)}</div>
        )}
        <div>
          <div className="hero-meta">
            <p className="kicker left">Official reciter</p>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <p className="lede">{qaari.bio}</p>
          <div className="progress-cell wide">
            <div className="progress lg">
              <i style={{ width: `${pct}%` }} />
            </div>
            <span>
              {qaari.uploadedJuzCount} / 30 Juz ({pct}%)
            </span>
          </div>
          <div className="mini-stats">
            <div>
              <b>{qaari.uploadedJuzCount}</b>
              <span>Uploaded</span>
            </div>
            <div>
              <b>{missingCount}</b>
              <span>Missing</span>
            </div>
            <div>
              <b>{formatDuration(totalSeconds || null)}</b>
              <span>Audio length</span>
            </div>
            <div>
              <b>{qaari.favoriteCount ?? 0}</b>
              <span>Favorites</span>
            </div>
          </div>
        </div>
      </section>

      <form className="card form-page upload-panel" onSubmit={upload}>
        <div className="upload-copy">
          <h3>Upload Juz {juzNumber}</h3>
          <p>
            {selectedReady
              ? "This Juz already has audio. Drop a new file to replace it."
              : "Choose a missing Juz below, then drop or browse an audio file."}
          </p>
        </div>
        <button
          type="button"
          className={`audio-dropzone ${drag ? "over" : ""} ${audio ? "has-file" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => onDrop(e)}
        >
          {audio ? (
            <div>
              <strong>{audio.name}</strong>
              <p>
                {formatBytes(audio.size)} · ready for Juz {juzNumber}
              </p>
            </div>
          ) : (
            <div>
              <strong>Drop MP3, AAC, or M4A here</strong>
              <p>Or click to browse. Max 80 MB.</p>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={AUDIO_ACCEPT}
          hidden
          onChange={(e) => applyAudio(e.target.files?.[0] ?? null)}
        />
        <div className="upload-actions">
          <label className="compact-label">
            Juz
            <select value={juzNumber} onChange={(e) => setJuzNumber(Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Juz {n} {byJuz.has(n) ? "— uploaded" : "— missing"}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary inline" disabled={busy || !audio}>
            {busy ? "Uploading..." : selectedReady ? "Replace Juz" : "Upload Juz"}
          </button>
        </div>
      </form>
      {error ? <div className="error">{error}</div> : null}

      <div className="juz-toolbar">
        <h3 className="section-title">
          Recitation library <span className="count-pill">{qaari.uploadedJuzCount}/30</span>
        </h3>
        <div className="filter-row">
          {(["all", "ready", "missing"] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`chip ${filter === key ? "on" : ""}`}
              onClick={() => setFilter(key)}
            >
              {key === "all" ? "All 30" : key === "ready" ? `Uploaded (${qaari.uploadedJuzCount})` : `Missing (${missingCount})`}
            </button>
          ))}
        </div>
      </div>

      {visibleJuz.length === 0 ? (
        <div className="card empty">
          <strong>{filter === "missing" ? "All 30 Juz are uploaded" : "No recordings yet"}</strong>
          <p>
            {filter === "missing"
              ? "This reciter is complete in the public apps."
              : "Select a Juz and upload the first recording."}
          </p>
        </div>
      ) : (
        <div className="juz-grid">
          {visibleJuz.map((n) => {
            const rec = byJuz.get(n);
            const selected = n === juzNumber;
            const isPlaying = rec ? playing === rec.id : false;
            return (
              <article
                key={n}
                className={`juz ${rec ? "ready" : "missing"} ${selected ? "selected" : ""} ${isPlaying ? "playing" : ""}`}
                onClick={() => setJuzNumber(n)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, n)}
              >
                <span className="juz-head">
                  <strong>Juz {n}</strong>
                  {rec ? <span className="dot" /> : null}
                </span>
                {rec ? (
                  <>
                    <div className="file">{formatDuration(rec.durationSeconds)}</div>
                    <div className="row compact" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn-ghost sm" onClick={() => togglePlay(rec)}>
                        {isPlaying ? "Pause" : "Play"}
                      </button>
                      <button type="button" className="btn btn-danger sm" onClick={() => void removeRecording(rec.id, n)}>
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="file">{selected ? "Selected for upload" : "Not uploaded"}</div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <audio ref={playerRef} preload="none" onEnded={() => setPlaying(null)} />
    </>
  );
}
