import React from "react";
import "./index.css";
import MobilePlanner from "./MobilePlanner";
import Home from "./Home";
import Ticket from "./Ticket";
import Scan from "./Scan";
import { seedWeek } from "./data";

type Route = { path: RegExp; render: (params: RegExpMatchArray | null) => React.ReactNode };

function useHashLocation() {
  const [hash, setHash] = React.useState(window.location.hash || "#/");
  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash.replace(/^#/, "");
}

const routes: Route[] = [
  { path: /^\/$/, render: () => <Home /> },
  { path: /^\/plan$/, render: () => <MobilePlanner /> },
  { path: /^\/ticket\/([^/]+)$/, render: (m) => <Ticket id={m?.[1] || ""} /> },
  { path: /^\/scan$/, render: () => <Scan /> },
];

export default function App() {
  const loc = useHashLocation();
  // Seed two demo bookings if none exist yet
  React.useEffect(() => {
    const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
    if (existing.length === 0) {
      const { sessions } = seedWeek();
      const now = new Date().toISOString();
      const pick = sessions.slice(0, 2);
      const demo = pick.map((s, i) => ({ id: `b:demo-${i + 1}`, sessionId: s.id, createdAt: now, attendedAt: null }));
      localStorage.setItem("bookings", JSON.stringify(demo));
    }
  }, []);
  for (const r of routes) {
    const m = loc.match(r.path);
    if (m) return <>{r.render(m)}</>;
  }
  // default redirect
  window.location.hash = "#/";
  return null;
}
