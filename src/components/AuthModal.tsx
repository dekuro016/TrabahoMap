// Sign up / log in pop-up. Guests can browse everything; this opens only when they choose to join
// (profile menu, "Get started", or an action that needs an account, like posting).
// The steps themselves live in AuthFlow (shared with the welcome screen).
import { useEffect, useState } from "react";
import type { AuthOptions } from "../lib/ui";
import AuthFlow from "./AuthFlow";

export default function AuthModal() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<AuthOptions>({});
  const [run, setRun] = useState(0); // new key each time → the flow starts fresh

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpts((e as CustomEvent<AuthOptions>).detail ?? {});
      setRun((n) => n + 1);
      setOpen(true);
    };
    window.addEventListener("trabahomap:auth", onOpen);
    return () => window.removeEventListener("trabahomap:auth", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>
          ×
        </button>
        <AuthFlow key={run} initial={opts} variant="modal" onDone={() => setOpen(false)} onLeave={() => setOpen(false)} />
      </div>
    </div>
  );
}
