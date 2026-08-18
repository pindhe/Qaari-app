import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Qaari, type Recording } from "../api";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
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

  async function refresh() {
    const { qaaris } = await api.qaaris();
    setQaari(qaaris.find((q) => q.id === id) ?? null);
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
      setError(err instanceof Error ? err.message : "Soo gelinta way fashilantay");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecording(recId: string) {
    if (!confirm("Ma rabtaa inaad tirtirto dhageysigan?")) return;
    await api.deleteRecording(recId);
    await refresh();
  }

  async function removeQaari() {
    if (!id || !confirm("Tirtiridda Qaariga waxay tirtiri doontaa dhammaan 30-ka Juz.")) return;
    await api.deleteQaari(id);
    navigate("/");
  }

  if (!qaari) {
    return (
      <div className="content">
        <Link to="/">← Ku noqo</Link>
        <p>{error || "Sugaya..."}</p>
      </div>
    );
  }

  return (
    <div className="content">
      <Link to="/">← Qaariyada</Link>
      <div className="detail-head" style={{ marginTop: 16 }}>
        {qaari.photoUrl ? (
          <img src={qaari.photoUrl} alt={qaari.name} />
        ) : (
          <div className="detail-photo" />
        )}
        <div>
          <h1>{qaari.name}</h1>
          <p className="meta">{qaari.bio}</p>
          <div className="row">
            <Link className="btn btn-ghost" to={`/qaaris/${qaari.id}/edit`}>
              Wax ka beddel
            </Link>
            <button className="btn btn-danger" type="button" onClick={removeQaari}>
              Tirtir
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 32 }}>Soo gelinta Juz (1–30)</h2>
      <form className="card form-page" onSubmit={upload}>
        <label>Lambarka Juz</label>
        <select
          value={juzNumber}
          onChange={(e) => setJuzNumber(Number(e.target.value))}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--line)" }}
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Juz {n} {byJuz.has(n) ? "(la beddeli karo)" : ""}
            </option>
          ))}
        </select>
        <label>Faylka codka (AAC / MP3 / M4A)</label>
        <input
          type="file"
          accept="audio/mpeg,audio/aac,audio/mp4,audio/m4a,audio/x-m4a"
          onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
          required
        />
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" disabled={busy || !audio}>
          {busy ? "Waa la soo gelinayaa..." : byJuz.has(juzNumber) ? "Beddel dhageysiga" : "Soo geli"}
        </button>
      </form>

      <div className="juz-grid">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
          const rec = byJuz.get(n);
          return (
            <div key={n} className={`juz ${rec ? "ready" : ""}`}>
              <strong>Juz {n}</strong>
              {rec ? (
                <>
                  <div className="file">{formatDuration(rec.durationSeconds)}</div>
                  <button type="button" className="btn btn-danger" style={{ marginTop: 8, padding: "6px 10px" }} onClick={() => removeRecording(rec.id)}>
                    Tirtir
                  </button>
                </>
              ) : (
                <div className="file">Lama soo gelin</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
