// Quest photos: picker for the Post page, gallery + full-screen viewer for the quest page.
import { useEffect, useState } from "react";
import { compressImage, MAX_PHOTOS } from "../lib/photos";
import { Icon } from "./Icons";

/** Add up to 3 photos. Each one is shrunk to a small JPEG before it is kept. */
export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const room = MAX_PHOTOS - photos.length - busy;

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > picked.length) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    setBusy(picked.length);
    const out: string[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        setError("Please choose image files (JPG or PNG).");
        continue;
      }
      try {
        out.push(await compressImage(f));
      } catch {
        setError("One photo couldn't be read. Try a JPG or PNG.");
      }
    }
    setBusy(0);
    if (out.length) onChange([...photos, ...out].slice(0, MAX_PHOTOS));
  }

  return (
    <div className="photo-picker">
      <div className="photo-tiles">
        {photos.map((src, i) => (
          <div className="photo-tile" key={i}>
            <img src={src} alt={`Photo ${i + 1} of the problem`} />
            <button type="button" className="photo-x" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(photos.filter((_, k) => k !== i))}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div className="photo-busy" key={`b${i}`} aria-label="Preparing photo" />
        ))}
        {room > 0 && (
          <label className="photo-add">
            <Icon name="camera" size={22} />
            {photos.length ? "Add more" : "Add photo"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                add(e.target.files);
                e.target.value = ""; // allow picking the same file again
              }}
            />
          </label>
        )}
      </div>
      {error && <div className="form-error">{error}</div>}
      <p className="muted small">Optional, up to {MAX_PHOTOS}. Don't include faces, IDs or your house number. Photos are shrunk and location data is removed.</p>
    </div>
  );
}

/** Thumbnails that open a full-screen viewer. */
export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <div className="gallery">
        {photos.map((src, i) => (
          <button key={i} className="gallery-item" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${photos.length}`}>
            <img src={src} alt={`${title} — photo ${i + 1}`} />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ photos, index, onIndex, onClose }: { photos: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  });
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <img src={photos[index]} alt={`Photo ${index + 1} of ${photos.length}`} onClick={(e) => e.stopPropagation()} />
      <button className="lb-btn lb-close" aria-label="Close" onClick={onClose}>
        <Icon name="x" size={20} />
      </button>
      {photos.length > 1 && (
        <>
          <button
            className="lb-btn lb-prev"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <Icon name="arrow" size={20} />
          </button>
          <button
            className="lb-btn lb-next"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <Icon name="arrow" size={20} />
          </button>
          <span className="lb-count">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
