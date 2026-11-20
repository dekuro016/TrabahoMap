// Inbox: quest chats, notifications (new quotes, hires, job alerts, applications) and — for workers — job alerts.
import { useState } from "react";
import AlertsCard from "../components/AlertsCard";
import { Avatar, Empty, RoleNotice } from "../components/Bits";
import { Icon, type IconName } from "../components/Icons";
import { timeAgo } from "../lib/format";
import { Link, navigate } from "../lib/router";
import { currentViewer, markNotificationsRead, notificationsFor, threadsFor, useDB } from "../lib/store";
import type { Notification } from "../lib/types";

type Tab = "messages" | "notifications" | "alerts";

const KIND_ICON: Record<Notification["kind"], IconName> = { alert: "bell", quote: "tag", hired: "check", application: "briefcase" };

export default function Inbox() {
  const db = useDB();
  const viewer = currentViewer(db);
  const threads = threadsFor(db);
  const notes = notificationsFor(db);
  const unreadMsgs = threads.reduce((s, t) => s + t.unread, 0);
  const unreadNotes = notes.filter((n) => !n.read).length;
  const [tab, setTab] = useState<Tab>(() => (viewer?.kind === "employer" || (unreadNotes > 0 && unreadMsgs === 0) ? "notifications" : "messages"));

  if (db.session.role === "guest") return <RoleNotice need="resident, worker or employer" action="see your messages and alerts" next="/inbox" />;
  if (!viewer)
    return (
      <div className="card notice">
        <Icon name="user" /> The Inbox is for residents, workers and employers. Switch accounts from the profile menu.
      </div>
    );

  const me = viewer.kind === "worker" ? db.workers.find((w) => w.id === viewer.id) : undefined;
  const tabs: { id: Tab; label: string; icon: IconName; count?: number }[] = [
    ...(viewer.kind !== "employer" ? [{ id: "messages" as Tab, label: "Messages", icon: "message" as IconName, count: unreadMsgs }] : []),
    { id: "notifications", label: "Notifications", icon: "bell", count: unreadNotes },
    ...(me ? [{ id: "alerts" as Tab, label: "Job alerts", icon: "spark" as IconName }] : []),
  ];

  return (
    <div className="inbox">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <Icon name="bell" size={14} /> Inbox
          </span>
          <h1>Messages &amp; alerts</h1>
          <p className="muted">Chats with {viewer.kind === "worker" ? "residents whose quests you quoted on" : "workers who quoted on your quests"}, plus updates on your quotes and jobs.</p>
        </div>
      </div>

      <div className="seg" role="tablist" aria-label="Inbox sections">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={16} /> {t.label}
            {t.count ? <span className="count">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "messages" &&
        (threads.length === 0 ? (
          <Empty title="No conversations yet">
            {viewer.kind === "worker" ? "Send a quote on a quest — then you can chat with the resident here." : "When a worker quotes on your quest, you can message them here."}
          </Empty>
        ) : (
          <div className="card list-card">
            {threads.map((t) => {
              const other = viewer.kind === "resident" ? t.worker.name : t.gig.residentName;
              const link = viewer.kind === "resident" ? `/gigs/${t.gig.id}?chat=${t.worker.id}` : `/gigs/${t.gig.id}`;
              return (
                <Link key={`${t.gig.id}-${t.worker.id}`} to={link} className="thread-row">
                  <Avatar name={other} size={42} />
                  <div className="thread-main">
                    <b className="one-line">
                      {other} <span className="muted small">· {t.gig.title}</span>
                    </b>
                    <span className={`one-line small ${t.unread ? "" : "muted"}`}>
                      {t.last ? `${t.last.from === (viewer.kind === "resident" ? "resident" : "worker") ? "You: " : ""}${t.last.text}` : "No messages yet — say hello"}
                    </span>
                  </div>
                  <div className="thread-side">
                    {t.last && <span className="muted small">{timeAgo(t.last.createdAt)}</span>}
                    {t.unread > 0 && <span className="pill-count">{t.unread}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === "notifications" && (
        <>
          {unreadNotes > 0 && (
            <div className="inbox-actions">
              <button className="link-btn" onClick={() => markNotificationsRead(notes.filter((n) => !n.read).map((n) => n.id))}>
                <Icon name="check" size={15} /> Mark all as read
              </button>
            </div>
          )}
          {notes.length === 0 ? (
            <Empty title="No notifications yet">{me ? "Set up a job alert to hear about new quests near you." : "You'll see new quotes and updates here."}</Empty>
          ) : (
            <div className="card list-card">
              {notes.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.link}`}
                  className={`notif-row${n.read ? "" : " unread"}`}
                  onClick={(e) => {
                    e.preventDefault();
                    markNotificationsRead([n.id]);
                    navigate(n.link);
                  }}
                >
                  <span className={`notif-icon ni-${n.kind}`}>
                    <Icon name={KIND_ICON[n.kind]} size={18} />
                  </span>
                  <div className="notif-main">
                    <b className="one-line">{n.title}</b>
                    <span className="one-line small muted">{n.body}</span>
                  </div>
                  <span className="muted small">{timeAgo(n.createdAt)}</span>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "alerts" && me && <AlertsCard worker={me} />}
    </div>
  );
}
