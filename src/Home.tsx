import React from "react";
import { BRAND, seedWeek, timeLabel, ICONS, classNames } from "./data";

type Booking = { id: string; sessionId: string; createdAt: string; attendedAt: string | null };

export default function Home() {
  const { sessions } = React.useMemo(seedWeek, []);
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    const b = JSON.parse(localStorage.getItem("bookings") || "[]");
    setBookings(b);
  }, []);

  const sessionById = React.useMemo(() => Object.fromEntries(sessions.map((s) => [s.id, s])), [sessions]);
  const upcoming = bookings
    .map((b) => ({ b, s: sessionById[b.sessionId] }))
    .filter((x) => !!x.s)
    .sort((a, z) => a.s.start.localeCompare(z.s.start));

  return (
    <div className="min-h-screen bg-neutral-50" style={{ ["--brand" as any]: BRAND } as React.CSSProperties}>
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[var(--brand)] to-[var(--brand)]/90 text-white">
        <div className="px-4 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold">N</div>
            <div className="text-xl font-semibold">your tickets</div>
            <a href="#/scan" className="ml-auto text-sm underline underline-offset-2 opacity-95">scan</a>
          </div>
        </div>
      </header>

      <main className="px-4 pb-24">
        <div className="mt-4 flex items-center gap-3">
          <a href="#/plan" className="px-4 h-10 rounded-full bg-[var(--brand)] text-white text-sm font-semibold">Plan more</a>
        </div>

        <div className="mt-6 space-y-4">
          {upcoming.length === 0 && (
            <div className="text-center text-gray-500 py-16">No upcoming tickets. Plan some sessions!</div>
          )}

          {upcoming.map(({ b, s }) => (
            <a key={b.id} href={`#/ticket/${encodeURIComponent(b.id)}`} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 items-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl select-none">
                  {ICONS[s.title] ?? "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[15px] truncate capitalize">{s.title}</h3>
                    <span className={classNames("text-[11px] px-2 py-0.5 rounded-full border", b.attendedAt ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200")}>{b.attendedAt ? "attended" : "upcoming"}</span>
                  </div>
                  <div className="text-[12px] text-gray-600 mt-0.5">{timeLabel(s.start)} • by {s.teacher}</div>
                </div>
                <div className="text-[12px] text-gray-500">view</div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

