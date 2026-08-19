import { useEffect, useState, type FormEvent } from "react";
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

  useEffect(() => {
    if (!id) return;
    api.qaari(id).then(({ qaari }: { qaari: Qaari }) => {
      setName(qaari.name);
      setBio(qaari.bio);
      setPreview(qaari.photoUrl);
    });
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("bio", bio);
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
          <h2>{editing ? "Edit reciter" : "Register a new reciter"}</h2>
          <p className="lede">Name, short biography, and official photo will appear in the public apps.</p>
        </div>
      </div>
      <form className="card form-page" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="photo-field">
            {preview ? <img src={preview} alt="" /> : <div className="photo-fallback">Photo</div>}
            <label className="file-btn">
              Choose photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhoto(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
          <div>
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Example: Sheikh Mohamed …" />
            <label>Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              placeholder="One or two sentences about the reciter and their recitation."
            />
          </div>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary inline" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </>
  );
}
