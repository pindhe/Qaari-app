import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Qaari } from "../api";
import BrandLogo from "../components/BrandLogo";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export default function QaariForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.qaari(id).then(({ qaari }: { qaari: Qaari }) => {
      setName(qaari.name);
      setBio(qaari.bio);
      setPreview(qaari.photoUrl);
      setStoredPhoto(qaari.photoUrl);
    });
  }, [id]);

  function applyFile(file: File | null) {
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose a JPG, PNG, or WEBP photo.");
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError("The photo must be 8 MB or smaller.");
        return;
      }
    }
    setError("");
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : storedPhoto;
    });
    setPhoto(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    applyFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
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
        navigate(`/qaaris/${created.qaari.id}?registered=1`);
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
          <ol className="steps" aria-label="Registration steps">
            <li className="current">1. Profile</li>
            <li>2. Juz recordings</li>
          </ol>
          <h2>{editing ? "Edit reciter" : "Register a new reciter"}</h2>
          <p className="lede">
            Name, short biography, and official photo will appear in the public apps.
          </p>
        </div>
      </div>

      <div className="register-layout">
        <form className="card form-page" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="photo-field">
              <button
                type="button"
                className={`dropzone ${drag ? "over" : ""} ${preview ? "has-file" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
              >
                {preview ? (
                  <img src={preview} alt="" />
                ) : (
                  <div>
                    <strong>Photo</strong>
                    <p>JPG, PNG, or WEBP</p>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
              />
              <button type="button" className="btn btn-ghost sm" onClick={() => fileRef.current?.click()}>
                Choose photo
              </button>
              {photo ? (
                <button type="button" className="btn btn-ghost sm" onClick={() => applyFile(null)}>
                  Remove photo
                </button>
              ) : null}
            </div>

            <div>
              <label htmlFor="qaari-name">Full name</label>
              <input
                id="qaari-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
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
                placeholder="One or two sentences about the reciter and their recitation."
              />
              <p className={`char-count ${bio.trim().length > 0 && bio.trim().length < 10 ? "warn" : ""}`}>
                {bio.trim().length} / 4000 · minimum 10 characters
              </p>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="row form-actions">
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
            <div className="phone-hero">
              <div className="phone-photo">
                {preview ? (
                  <img src={preview} alt="" />
                ) : (
                  <BrandLogo variant="on-dark" className="phone-fallback" alt="" />
                )}
              </div>
              <div className="phone-copy">
                <strong>{name.trim() || "Reciter name"}</strong>
                <p>{bio.trim() || "Biography will appear here."}</p>
              </div>
            </div>
            <div className="phone-juz-list" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <div key={n} className="phone-juz-row">
                  <span>Juz {n}</span>
                  <span>Not uploaded yet</span>
                </div>
              ))}
              <div className="phone-juz">Juz 1–30 will list here after upload</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
