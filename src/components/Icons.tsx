import type { ServiceCategory } from "../lib/types";

const PATHS: Record<ServiceCategory, string> = {
  Electrician: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  Plumber: "M12 2.7C9 6.6 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7.4-6-11.3z",
  "Appliance Repair": "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm-2 7h16M8 5.5h.01M8 13v4",
  "Aircon Technician": "M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5",
  Carpenter: "M14 4l6 6-3 3-6-6zM11 7 3 15l3 3 8-8",
  Mason: "M3 5h18v4H3zM3 9h18v5H3zM3 14h18v5H3zM9 5v4M15 9v5M9 14v5",
  Welder: "M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-3 3 0-3-1-5-3-7 0 4-4 7-4 13 0 4 3 7 7 7z",
  Painter: "M4 3h13v5H4zM17 5.5h3v5l-8 2v3M10 15.5h4V22h-4z",
  Tutor: "M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z",
  "Tech Support": "M3 4h18v12H3zM8 20h8M12 16v4",
  "Home Cleaning": "M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  "Event Assistance": "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M12 13l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z",
};

export function CategoryIcon({ category, size = 20 }: { category: ServiceCategory; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[category]} />
    </svg>
  );
}

export type IconName =
  | "pin" | "check" | "shield" | "spark" | "clock" | "star" | "map" | "list" | "alert" | "user" | "search"
  | "briefcase" | "users" | "plus" | "bell" | "message" | "camera" | "tag" | "grid" | "home" | "x" | "send" | "arrow" | "trash" | "lock";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const d: Record<string, string> = {
    pin: "M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    check: "M20 6 9 17l-5-5",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
    spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
    map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    briefcase: "M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18",
    users: "M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    plus: "M12 5v14M5 12h14",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    message: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z",
    camera: "M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    home: "M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5",
    x: "M18 6 6 18M6 6l12 12",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
    arrow: "M5 12h14M13 6l6 6-6 6",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d[name]} />
    </svg>
  );
}
