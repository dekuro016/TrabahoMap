// Floating AI Assistant (bottom-right chat head, like Messenger).
// Helps residents describe a problem in English/Filipino/Taglish, then hands a reviewed summary
// to the "Post a problem" form. It never posts a quest or hires anyone by itself.
import { useEffect, useRef, useState } from "react";
import { askAssistant, type ChatMessage } from "../lib/assistant";
import { townName } from "../lib/format";
import { saveQuestDraft } from "../lib/questDraft";
import { navigate } from "../lib/router";
import type { ServiceCategory, Urgency } from "../lib/types";
import { CategoryChip, UrgencyBadge } from "./Bits";
import { Icon } from "./Icons";

const STARTERS = ["May tumutulo sa ilalim ng lababo", "Nag-spark ang saksakan namin", "Hindi lumalamig ang aircon", "Need a math tutor for my kid"];

function Bubble({ m, onUse }: { m: ChatMessage; onUse: (m: ChatMessage) => void }) {
  if (m.role === "user") return <div className="msg user">{m.text}</div>;
  return (
    <div className="msg bot">
      {m.emergency && (
        <div className="msg-emergency" role="alert">
          <Icon name="alert" size={16} />
          <div>
            <b>Safety first</b>
            <div>{m.emergency}</div>
          </div>
        </div>
      )}
      <div>{m.text}</div>
      {m.summary && (
        <div className="msg-summary">
          <div className="sum-head">
            <CategoryChip category={m.summary.category as ServiceCategory} />
            <UrgencyBadge urgency={m.summary.urgency as Urgency} />
          </div>
          <b className="sum-title">{m.summary.title}</b>
          <p>{m.summary.description}</p>
          {m.summary.safetyTip && (
            <p className="sum-safety">
              <Icon name="shield" size={13} /> {m.summary.safetyTip}
            </p>
          )}
          <p className="muted small">
            <Icon name="pin" size={12} /> {m.summary.townId ? `${m.summary.barangay ? m.summary.barangay + ", " : ""}${townName(m.summary.townId)}` : "Location: choose it in the form"}
          </p>
          <button className="btn btn-primary btn-sm full-w" onClick={() => onUse(m)}>
            Use details for my quest
          </button>
          <p className="muted tiny">You'll review and edit everything before posting. Nothing is posted automatically. This is an AI suggestion, not a professional diagnosis.</p>
        </div>
      )}
    </div>
  );
}

export default function AssistantChat({ raised }: { raised?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const history = [...messages, { role: "user" as const, text: t }];
    setMessages(history);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const r = await askAssistant(history);
      setMessages([...history, { role: "assistant", text: r.reply, stage: r.stage, emergency: r.emergency, quickReplies: r.quickReplies, summary: r.summary, source: r.source }]);
    } catch {
      setError("Sorry, something went wrong. Please try again.");
      setMessages(history.slice(0, -1));
      setInput(t);
    } finally {
      setBusy(false);
    }
  }

  function useDetails(m: ChatMessage) {
    if (!m.summary) return;
    saveQuestDraft(m.summary);
    setOpen(false);
    navigate("/post");
    window.dispatchEvent(new Event("trabahomap:draft"));
  }

  const last = messages[messages.length - 1];
  const quick = !busy && last?.role === "assistant" && !last.summary ? last.quickReplies ?? [] : [];

  return (
    <>
      {!open && (
        <button className={`chat-head${raised ? " raised" : ""}`} onClick={() => setOpen(true)} aria-label="Open TrabahoMap AI Assistant">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
            <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
          </svg>
          <span className="chat-head-badge">AI</span>
          <span className="chat-head-label">Ask AI</span>
        </button>
      )}

      {open && (
        <section className={`chat-panel${raised ? " raised" : ""}`} role="dialog" aria-label="TrabahoMap AI Assistant">
          <header className="chat-top">
            <span className="chat-avatar" aria-hidden="true">
              <Icon name="spark" size={18} />
            </span>
            <div className="grow">
              <b>TrabahoMap Assistant</b>
              <span className="muted tiny">Describe your problem · English, Filipino o Taglish</span>
            </div>
            {messages.length > 0 && (
              <button
                className="chat-icon-btn"
                title="New conversation"
                aria-label="Start a new conversation"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                  setInput("");
                }}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
            )}
            <button className="chat-icon-btn" title="Minimize" aria-label="Minimize assistant" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
          </header>

          <div className="chat-body" ref={list}>
            <div className="msg bot">
              Hi! I'm the TrabahoMap Assistant. Tell me what's wrong at home or what help you need — in English, Filipino or Taglish — and I'll help you turn it into a quest
              for local workers.
            </div>
            {messages.length === 0 && (
              <div className="chat-starters">
                {STARTERS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} m={m} onUse={useDetails} />
            ))}
            {busy && (
              <div className="msg bot typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}
            {error && (
              <div className="chat-error">
                {error}{" "}
                <button className="link-btn" onClick={() => send(input)}>
                  Retry
                </button>
              </div>
            )}
          </div>

          {quick.length > 0 && (
            <div className="chat-quick">
              {quick.map((q) => (
                <button key={q} className="chip" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder="Type your message…"
              maxLength={600}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button className="chat-send" type="submit" disabled={!input.trim() || busy} aria-label="Send">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </form>
          <p className="chat-foot tiny">AI can make mistakes. In an emergency, call 911.</p>
        </section>
      )}
    </>
  );
}
