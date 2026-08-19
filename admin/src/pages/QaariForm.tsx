import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Qaari } from "../api";

export default function QaariForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.qaari(id).then(({ qaari }: { qaari: Qaari }) => {
      setName(qaari.name);
      setBio(qaari.bio);
      setPreview(qaari.photoUrl);
    });
  }, [id]);

  function setFile(file: File | null) {
    setPhoto(file);
    if (file) setPreview(URL.createObjectURL(file));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setFile(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (bio.trim().length < 10) {
      setError("Biography must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("bio", bio.trim());
      if (photo) form.set("photo", photo);
      if (editing && id) {
        await api.updateQaari(id, form);
        navigate(`/qaaris/${id}`);
      } else {
        const created = await api.createQaari(form);
        navigate(`/qaaris/${created.qaari.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Link className="crumb" to="/qaaris">
        ← Back to Qaari list
      </Link>
      <div className="page-head">
        <div>
          <p className="step-line">Step 1 of 2 · Profile</p>
          <h2>{editing ? "Edit reciter" : "Register a new reciter"}</h2>
          <p className="lede">
            This profile is what listeners see in the iOS and Android apps. After saving, you can upload the 30 Juz.
          </p>
        </div>
      </div>

      <div className="register-layout">
        <form className="card form-page" onSubmit={onSubmit}>
          <label className={`dropzone ${drag ? "over" : ""} ${preview ? "has-file" : ""}`}>
            {preview ? (
              <img src={preview} alt="" />
            ) : (
              <div>
                <strong>Official photo</strong>
                <p>Drag a JPG, PNG, or WEBP here, or click to browse. Max 8 MB.</p>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <span
              className="drop-catch"
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            />
          </label>
          {preview ? (
            <button type="button" className="btn btn-ghost sm" onClick={() => { setPhoto(null); setPreview(null); }}>
              Remove photo
            </button>
          ) : null}

          <label htmlFor="qaari-name">Full name</label>
          <input
            id="qaari-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Example: Sheikh Mohamed Hassan"
          />

          <label htmlFor="qaari-bio">Biography</label>
          <textarea
            id="qaari-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            placeholder="One or two sentences about the reciter, city, and style of recitation."
          />
          <p className="char-count">{bio.trim().length} / 4000 · minimum 10 characters</p>

          {error ? <div className="error">{error}</div> : null}

          <div className="row">
            <Link className="btn btn-ghost" to="/qaaris">
              Cancel
            </Link>
            <button className="btn btn-primary inline" disabled={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Save and upload Juz"}
            </button>
          </div>
        </form>

        <aside className="card app-preview">
          <p className="kicker left">App preview</p>
          <h3>How listeners will see this</h3>
          <div className="phone">
            <div className="phone-photo">
              {preview ? <img src={preview} alt="" /> : <span>{name.trim().slice(0, 1) || "Q"}</span>}
            </div>
            <strong>{name.trim() || "Reciter name"}</strong>
            <p>{bio.trim() || "Biography will appear here."}</p>
            <div className="phone-juz">Juz 1–30 will list here after upload</div>
          </div>
        </aside>
      </div>
    </>
  );
}
