// Chat inside one quest, between the resident who posted it and one worker who quoted.
// Phone numbers and emails are hidden until that worker is hired (keeps people safe and on the platform).
import { useEffect, useRef, useState } from "react";
import { timeAgo } from "../lib/format";
import { isHired, markThreadSeen, sendMessage, threadMessages, useDB } from "../lib/store";
import type { Gig, Worker } from "../lib/types";
import { Avatar } from "./Bits";
import { Icon } from "./Icons";

export default function QuestChat({ gig, worker, viewer, onClose }: { gig: Gig; worker: Worker; viewer: "resident" | "worker"; onClose?: () => void }) {
  const db = useDB();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const body = useRef<HTMLDivElement>(null);
  const msgs = threadMessages(db, gig.id, worker.id);
  const hired = isHired(db, gig.id, worker.id);
  const otherName = viewer === "resident" ? worker.name : gig.residentName;
  const unseen = msgs.some((m) => m.from !== viewer && !m.seen);

  // Opening the chat marks the other person's messages as seen
  useEffect(() => {
    if (unseen) markThreadSeen(gig.id, worker.id, viewer);
  }, [unseen, gig.id, worker.id, viewer]);

  // Keep the newest message in view
  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight });
  }, [msgs.length]);

  function send() {
    const m = sendMessage(gig.id, worker.id, viewer, text);
    if (!m) return;
    setText("");
    setNote(m.masked ? "We hid a phone number or email in your message. You can share contact details after hiring." : "");
  }

  const closed = gig.status === "Cancelled";

  return (
    <div className="card qchat">
      <div className="qchat-head">
        <Avatar name={otherName} size={36} />
        <div>
          <b>{otherName}</b>
          <span className="muted small">{viewer === "resident" ? "Worker who quoted" : "Posted this quest"} · {gig.title}</span>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-sm icon-only" aria-label="Close chat" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      <div className="qchat-body" ref={body} aria-live="polite">
        {msgs.length === 0 && <p className="qchat-empty">No messages yet. Ask about schedule, materials, or the price.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.from === viewer ? "me" : "them"}`}>
            {m.text}
            {m.masked && <span className="bubble-flag">Contact details hidden until hired</span>}
            <span className="bubble-time">
              {timeAgo(m.createdAt)}
              {m.from === viewer && m.seen ? " · Seen" : ""}
            </span>
          </div>
        ))}
      </div>

      <div className={`qchat-lock${hired ? " ok" : ""}`}>
        <Icon name={hired ? "check" : "lock"} size={13} />
        {hired
          ? "Hired — you can now share phone numbers."
          : viewer === "resident"
            ? "Phone numbers stay hidden until you hire. Never pay in advance outside TrabahoMap."
            : "Phone numbers stay hidden until you're hired. Never ask for payment in advance."}
      </div>
      {note && <div className="warn small qchat-note">{note}</div>}

      {closed ? (
        <p className="muted small center qchat-closed">This quest was cancelled.</p>
      ) : (
        <div className="qchat-input">
          <textarea
            rows={1}
            value={text}
            placeholder={`Message ${otherName.split(" ")[0]}…`}
            aria-label="Type a message"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" aria-label="Send" disabled={!text.trim()} onClick={send}>
            <Icon name="send" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
