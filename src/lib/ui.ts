// Small app-wide UI signals (open the sign-up modal, show a toast) without extra libraries.
import type { Account } from "./types";

export interface AuthOptions {
  mode?: "signup" | "login";
  role?: Account["role"];
  /** Short reason shown at the top, e.g. "Sign up to post a problem". */
  reason?: string;
  /** Where to go after signing in (hash route, e.g. "/post"). */
  next?: string;
}

export function openAuth(opts: AuthOptions = {}) {
  window.dispatchEvent(new CustomEvent<AuthOptions>("trabahomap:auth", { detail: opts }));
}

/** Show the welcome screen again (footer link for demos). The caller also resets the session flag. */
export function openWelcome() {
  window.dispatchEvent(new Event("trabahomap:welcome"));
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent<string>("trabahomap:toast", { detail: message }));
}
