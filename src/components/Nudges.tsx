// Toast messages + the occasional, dismissible "Get started" prompt for guests.
import { useEffect, useState } from "react";
import { useDB } from "../lib/store";
import { openAuth } from "../lib/ui";

export function Toaster() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, text: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3800);
    };
    window.addEventListener("trabahomap:toast", on);
    return () => window.removeEventListener("trabahomap:toast", on);
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

const KEY = "trabahomap-nudge";
const FIRST_DELAY = 25_000; // first prompt after 25 s of browsing
const REPEAT_DELAY = 4 * 60_000; // at most once more, 4 min after dismissing
const MAX_PER_SESSION = 2;

function readCount() {
  try {
    return Number(sessionStorage.getItem(KEY) || "0");
  } catch {
    return MAX_PER_SESSION;
  }
}

/** Non-intrusive slide-in card for guests. Never blocks the page; easy to dismiss. */
export function GetStartedNudge({ blocked }: { blocked: boolean }) {
  const db = useDB();
  const guest = db.session.role === "guest";
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(readCount);

  useEffect(() => {
    if (!guest || blocked || show || shown >= MAX_PER_SESSION) return;
    const t = setTimeout(
      () => {
        setShow(true);
        const n = shown + 1;
        setShown(n);
        try {
          sessionStorage.setItem(KEY, String(n));
        } catch {
          /* ignore */
        }
      },
      shown === 0 ? FIRST_DELAY : REPEAT_DELAY,
    );
    return () => clearTimeout(t);
  }, [guest, blocked, show, shown]);

  useEffect(() => {
    if (!guest) setShow(false);
  }, [guest]);

  if (!show || !guest) return null;
  return (
    <aside className="nudge" aria-label="Get started with TrabahoMap">
      <button className="nudge-close" aria-label="Dismiss" onClick={() => setShow(false)}>
        ×
      </button>
      <b>Need help at home, or looking for work?</b>
      <p className="muted small">Create a free account to post problems, send quotes, or apply for steady jobs. Browsing stays free without one.</p>
      <div className="nudge-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShow(false);
            openAuth();
          }}
        >
          Get started
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>
          Maybe later
        </button>
      </div>
    </aside>
  );
}
