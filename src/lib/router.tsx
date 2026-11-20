// Tiny hash router (#/board, #/workers/w1 …). Works on any static host with no server config.
import { useEffect, useState, type ReactNode, type MouseEvent } from "react";

export function useRoute(): string[] {
  const read = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0].split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: (e: MouseEvent) => void }) {
  return (
    <a href={`#${to}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
