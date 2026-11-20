// Opening animation (like a streaming app's logo intro). Plays once per browser session.
// Click, tap or press any key to skip. Respects "reduce motion" settings.
import { useEffect, useState } from "react";
import { intro } from "../lib/intro";

const KEY = "trabahomap-intro-seen";
const LETTERS = "TrabahoMap".split("");

function shouldPlay() {
  try {
    if (new URLSearchParams(window.location.search).has("intro")) return true;
    return sessionStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

export function replayIntro() {
  window.dispatchEvent(new Event("trabahomap:intro"));
}

export default function Intro() {
  const [phase, setPhase] = useState<"play" | "leave" | "done">(() => {
    const play = shouldPlay();
    if (play) intro.start();
    return play ? "play" : "done";
  });

  useEffect(() => {
    const again = () => {
      intro.start();
      setPhase("play");
    };
    window.addEventListener("trabahomap:intro", again);
    return () => window.removeEventListener("trabahomap:intro", again);
  }, []);

  useEffect(() => {
    if (phase === "done") return;
    if (phase === "leave") {
      const t = setTimeout(() => {
        setPhase("done");
        intro.finish();
      }, 650);
      return () => clearTimeout(t);
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setPhase("leave"), reduce ? 900 : 3000);
    const skip = () => setPhase("leave");
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", skip);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className={`intro ${phase === "leave" ? "intro-leave" : ""}`} onClick={() => setPhase("leave")} role="presentation">
      <div className="intro-stage">
        <div className="intro-pin">
          <span className="intro-ring" />
          <span className="intro-ring r2" />
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="intro-pin-body" d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z" />
            <path className="intro-check" d="M9.5 10.5 11.5 12.5 15 9" />
          </svg>
        </div>
        <h1 className="intro-word" aria-label="TrabahoMap">
          {LETTERS.map((c, i) => (
            <span key={i} className={i >= 7 ? "accent" : ""} style={{ animationDelay: `${0.75 + i * 0.06}s` }} aria-hidden="true">
              {c}
            </span>
          ))}
        </h1>
        <div className="intro-line" />
        <p className="intro-tag">The right help, right in your barangay.</p>
      </div>
      <span className="intro-skip">Tap to skip</span>
    </div>
  );
}
