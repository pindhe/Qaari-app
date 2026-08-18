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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.qaaris().then(({ qaaris }) => {
      const found = qaaris.find((q: Qaari) => q.id === id);
      if (found) {
        setName(found.name);
        setBio(found.bio);
      }
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
      setError(err instanceof Error ? err.message : "Khalad ayaa dhacay");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content" style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link to="/">← Ku noqo</Link>
      <h1>{editing ? "Wax ka beddel Qaariga" : "Ku dar Qaari cusub"}</h1>
      <form className="card form-page" onSubmit={onSubmit}>
        <label>Magaca</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Taariikh-nololeed / Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} required />
        <label>Sawir</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        {error ? <div className="error">{error}</div> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Sug..." : "Kaydi"}
        </button>
      </form>
    </div>
  );
}
