import { useState } from "react";
import { Avatar, CategoryChip, Empty, StatusBadge, Stars, UrgencyBadge } from "../components/Bits";
import { WorkerCard } from "../components/Cards";
import { Icon } from "../components/Icons";
import LocationCard from "../components/LocationCard";
import { PhotoGallery } from "../components/Photos";
import PriceGuide, { FairTag } from "../components/PriceGuide";
import QuestChat from "../components/QuestChat";
import { checkReview } from "../lib/ai";
import { timeAgo, townName } from "../lib/format";
import { distanceKm, matchWorkers } from "../lib/matching";
import { Link } from "../lib/router";
import { acceptQuote, addQuote, addReview, getDB, residentName, setGigStatus, threadMessages, useDB, workerRating } from "../lib/store";
import { openAuth } from "../lib/ui";
import type { Review } from "../lib/types";

export default function GigDetail({ id }: { id: string }) {
  const db = useDB();
  const gig = db.gigs.find((g) => g.id === id);

  // quote form (worker)
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");
  // review form (resident)
  const [rating, setRating] = useState<Review["rating"]>(5);
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ flagged: boolean; reasons: string[] } | null>(null);
  // which worker's chat is open (resident view); "?chat=w1" in the link opens it directly (from the Inbox)
  const [chatWith, setChatWith] = useState<string | null>(() => new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("chat"));

  if (!gig) return <Empty title="Gig not found" />;

  const { role, workerId } = db.session;
  const isOwner = role === "resident" && gig.residentName === residentName(db);
  const me = role === "worker" ? db.workers.find((w) => w.id === workerId) : undefined;
  const quotes = db.quotes.filter((q) => q.gigId === gig.id);
  const myQuote = me && quotes.find((q) => q.workerId === me.id);
  const matches = gig.status === "Open" ? matchWorkers(db, gig, 5) : [];
  const assigned = db.workers.find((w) => w.id === gig.assignedWorkerId);
  const existingReview = db.reviews.find((r) => r.gigId === gig.id);
  const chatOpenWorker = chatWith && quotes.some((q) => q.workerId === chatWith) ? db.workers.find((w) => w.id === chatWith) : undefined;

  async function submitReview() {
    if (!assigned) return;
    setChecking(true);
    const draft = { workerId: assigned.id, gigId: gig!.id, residentName: residentName(getDB()), rating, text: text.trim() };
    const result = await checkReview(getDB(), draft);
    addReview({ ...draft, flagged: result.flagged, flagReasons: result.reasons, status: result.flagged ? "Under Review" : "Visible" });
    setReviewResult(result);
    setChecking(false);
  }

  return (
    <div>
      <Link to="/board" className="back">
        ← Quest board
      </Link>
      <div className="profile-grid">
        <div className="stack">
          <div className={`card gig-head urg-edge-${gig.urgency.toLowerCase()}`}>
            <div className="badges-row">
              <UrgencyBadge urgency={gig.urgency} />
              <StatusBadge status={gig.status} />
              <CategoryChip category={gig.category} />
            </div>
            <h1>{gig.title}</h1>
            <blockquote>“{gig.rawDescription}”</blockquote>
            {gig.photos && gig.photos.length > 0 && <PhotoGallery photos={gig.photos} title={gig.title} />}
            <div className="quest-meta">
              <span>
                <Icon name="user" size={14} /> {gig.residentName}
              </span>
              <span>
                <Icon name="pin" size={14} /> {gig.barangay}, {townName(gig.townId)}
              </span>
              <span>
                <Icon name="clock" size={14} /> {timeAgo(gig.createdAt)}
              </span>
            </div>
          </div>

          <div className="card ai-card compact">
            <div className="eyebrow">
              <Icon name="spark" size={14} /> AI analysis
            </div>
            <div className="kv">
              <span>Service</span>
              <b>{gig.category}</b>
            </div>
            <div className="kv">
              <span>Specific issue</span>
              <b>{gig.specificIssue}</b>
            </div>
            <div className="kv">
              <span>Urgency</span>
              <UrgencyBadge urgency={gig.urgency} />
            </div>
            <div className="kv">
              <span>Analyzed by</span>
              <span className="muted">
                {gig.aiSource === "gemini" ? "Gemini AI" : "Keyword fallback"} · {Math.round(gig.aiConfidence * 100)}% confidence
              </span>

            </div>
            {gig.safetyTip && (
              <div className="safety">
                <Icon name="shield" size={18} />
                <div>
                  <b>Safety first</b>
                  <div>{gig.safetyTip}</div>
                </div>
              </div>
            )}
          </div>

          {gig.status === "Open" && (
            <div className="card">
              <h2>AI-recommended workers</h2>
              <p className="muted small">Ranked by skill match (40%), distance (25%), rating (25%) and response rate (10%).</p>
              {matches.length === 0 ? (
                <p className="muted">No verified workers nearby for this service yet.</p>
              ) : (
                <div className="stack">
                  {matches.map((m, i) => (
                    <WorkerCard
                      key={m.worker.id}
                      worker={m.worker}
                      extra={
                        <div className="why">
                          <b>#{i + 1}</b> · match {Math.round(m.score * 100)}% · {m.reasons.join(" · ")}
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <LocationCard lat={gig.lat} lng={gig.lng} barangay={gig.barangay} townId={gig.townId} gigs={[gig]} workers={assigned ? [assigned] : matches.map((m) => m.worker)} />
        </div>

        <aside className="stack">
          {/* Quotes */}
          <div className="card">
            <h2>Quotes ({quotes.length})</h2>
            {gig.status === "Open" && <PriceGuide category={gig.category} townId={gig.townId} compact />}
            {quotes.length === 0 && <p className="muted small">No quotes yet. Matched workers will be notified.</p>}
            <div className="stack">
              {quotes.map((q) => {
                const w = db.workers.find((x) => x.id === q.workerId);
                if (!w) return null;
                const r = workerRating(db, w.id);
                const unread = isOwner ? threadMessages(db, gig.id, w.id).filter((m) => m.from === "worker" && !m.seen).length : 0;
                return (
                  <div key={q.id} className={`quote ${q.status.toLowerCase()}${isOwner && chatWith === w.id ? " chatting" : ""}`}>
                    <div className="quote-head">
                      <Avatar name={w.name} size={36} />
                      <div>
                        <Link to={`/workers/${w.id}`}>
                          <b>{w.name}</b>
                        </Link>
                        <div className="small">
                          <Stars value={r.avg} count={r.count} /> · {distanceKm(gig, w).toFixed(1)} km
                        </div>
                      </div>
                      <div className="quote-price">
                        <span className="price">{q.priceRange}</span>
                        <FairTag priceText={q.priceRange} category={gig.category} townId={gig.townId} />
                      </div>
                    </div>
                    <p className="small">{q.message}</p>
                    <div className="quote-foot">
                      <span className="muted small">{timeAgo(q.createdAt)}</span>
                      <div className="quote-actions">
                        {isOwner && gig.status !== "Cancelled" && (
                          <button className="btn btn-ghost btn-sm btn-chat" onClick={() => setChatWith(chatWith === w.id ? null : w.id)} aria-expanded={chatWith === w.id}>
                            <Icon name="message" size={15} /> {chatWith === w.id ? "Hide chat" : "Message"}
                            {unread > 0 && chatWith !== w.id && <span className="unread-dot">{unread}</span>}
                          </button>
                        )}
                        {q.status !== "Pending" ? (
                          <span className={`badge ${q.status === "Accepted" ? "status-done" : "status-cancelled"}`}>{q.status}</span>
                        ) : isOwner && gig.status === "Open" ? (
                          <button className="btn btn-primary btn-sm" onClick={() => acceptQuote(q.id)}>
                            Hire {w.name.split(" ")[0]}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resident: chat with the selected worker */}
          {isOwner && chatOpenWorker && <QuestChat key={chatOpenWorker.id} gig={gig} worker={chatOpenWorker} viewer="resident" onClose={() => setChatWith(null)} />}

          {/* Worker: chat with the resident once you've quoted */}
          {me && myQuote && <QuestChat gig={gig} worker={me} viewer="worker" />}

          {/* Guests: invite workers to sign up and quote */}
          {role === "guest" && gig.status === "Open" && (
            <div className="card">
              <h3>Can you do this job?</h3>
              <p className="muted small">Create a free worker account to send a quote to {gig.residentName.split(" ")[0]}.</p>
              <button className="btn btn-primary full-w" onClick={() => openAuth({ role: "worker", reason: "Create a free worker account to send quotes." })}>
                Sign up as a worker
              </button>
            </div>
          )}

          {/* Worker: send quote */}
          {me && gig.status === "Open" && me.verification !== "Verified" && (
            <div className="card warn">Your profile is waiting for ID verification. You can send quotes once an admin approves it.</div>
          )}
          {me && me.verification === "Verified" && gig.status === "Open" && (
            <div className="card">
              {!me.categories.includes(gig.category) ? (
                <p className="muted small">This quest needs a {gig.category}. It doesn't match your services.</p>
              ) : (
                <>
                  <h3>{myQuote ? "Update your quote" : "Send a quote"}</h3>
                  <label className="field">
                    <span>Price range</span>
                    <input value={price} placeholder="e.g. ₱500 – ₱900" onChange={(e) => setPrice(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Message</span>
                    <textarea rows={3} value={msg} placeholder="When can you come? What will you check first?" onChange={(e) => setMsg(e.target.value)} />
                  </label>
                  <button
                    className="btn btn-primary full-w"
                    disabled={!price.trim() || !msg.trim()}
                    onClick={() => {
                      addQuote({ gigId: gig.id, workerId: me.id, priceRange: price.trim(), message: msg.trim() });
                      setPrice("");
                      setMsg("");
                    }}
                  >
                    {myQuote ? "Update quote" : "Send quote"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* In progress */}
          {gig.status === "In Progress" && assigned && (
            <div className="card">
              <h3>Hired worker</h3>
              <WorkerCard worker={assigned} />
              <p className="muted small mt">Contact: {assigned.phone}</p>
              {isOwner && (
                <button className="btn btn-primary full-w mt" onClick={() => setGigStatus(gig.id, "Done")}>
                  <Icon name="check" /> Mark job as done
                </button>
              )}
            </div>
          )}

          {/* Done → review */}
          {gig.status === "Done" && assigned && (
            <div className="card">
              <h3>Job completed by {assigned.name}</h3>
              {existingReview ? (
                <div className="review">
                  <div className="review-head">
                    <b>{existingReview.residentName}</b>
                    <span className="rating-stars">{"★".repeat(existingReview.rating)}{"☆".repeat(5 - existingReview.rating)}</span>
                  </div>
                  <p>{existingReview.text}</p>
                  {existingReview.status === "Under Review" && (
                    <div className="warn">
                      <Icon name="alert" size={16} /> Review Guard flagged this review — an admin will check it before it's shown.
                      <ul>
                        {existingReview.flagReasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {reviewResult && !reviewResult.flagged && <div className="ok">Thanks! Your review is now on {assigned.name.split(" ")[0]}'s profile.</div>}
                </div>
              ) : isOwner ? (
                <>
                  <div className="star-input" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} className={n <= rating ? "on" : ""} onClick={() => setRating(n as Review["rating"])} aria-label={`${n} stars`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <label className="field">
                    <span>Your review</span>
                    <textarea rows={3} value={text} placeholder="How was the work? Was it on time and fairly priced?" onChange={(e) => setText(e.target.value)} />
                  </label>
                  <button className="btn btn-primary full-w" disabled={!text.trim() || checking} onClick={submitReview}>
                    {checking ? "Checking with Review Guard…" : "Post review"}
                  </button>
                  <p className="muted small mt">
                    Reviews are checked by AI Review Guard for fake or abusive content. See <Link to="/policies/trust">Verification &amp; Reviews</Link>.
                  </p>
                </>
              ) : (
                <p className="muted small">No review yet.</p>
              )}
            </div>
          )}

          {isOwner && gig.status === "Open" && (
            <button className="link-btn danger" onClick={() => setGigStatus(gig.id, "Cancelled")}>
              Cancel this request
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
