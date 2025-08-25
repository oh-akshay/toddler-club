import React from "react";
import QR from "./qr";
import { BRAND, ICONS, seedWeek, timeLabel } from "./data";

type Booking = { id: string; sessionId: string; createdAt: string; attendedAt: string | null };

export default function Ticket({ id }: { id: string }) {
  const { sessions } = React.useMemo(seedWeek, []);
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const session = React.useMemo(() => sessions.find((s) => s.id === booking?.sessionId), [sessions, booking]);

  React.useEffect(() => {
    const list: Booking[] = JSON.parse(localStorage.getItem("bookings") || "[]");
    const decoded = (() => { try { return decodeURIComponent(id); } catch { return id; } })();
    const b = list.find((x) => x.id === decoded) || null;
    setBooking(b);
  }, [id]);

  if (!booking || !session) {
    return (
      <div className="min-h-screen bg-neutral-50" style={{ ["--brand" as any]: BRAND } as React.CSSProperties}>
        <header className="sticky top-0 z-40 bg-gradient-to-b from-[var(--brand)] to-[var(--brand)]/90 text-white">
          <div className="px-4 pt-6 pb-5 flex items-center gap-3">
            <button onClick={() => history.back()} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">←</button>
            <div className="text-xl font-semibold">ticket</div>
          </div>
        </header>
        <div className="px-4 py-16 text-center text-gray-500">Ticket not found.</div>
      </div>
    );
  }

  const payload = `openhouse:booking:${booking.id}`;

  return (
    <div className="min-h-screen bg-neutral-50" style={{ ["--brand" as any]: BRAND } as React.CSSProperties}>
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[var(--brand)] to-[var(--brand)]/90 text-white">
        <div className="px-4 pt-6 pb-5 flex items-center gap-3">
          <button onClick={() => (window.location.hash = "#/")} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">←</button>
          <div className="text-xl font-semibold">ticket</div>
        </div>
      </header>

      <main className="px-4 pb-24">
        <div className="mt-5 mx-auto max-w-sm bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl select-none">
              {ICONS[session.title] ?? "🎯"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-gray-500">Nikita’s ticket</div>
              <div className="font-semibold text-[15px] capitalize truncate">{session.title}</div>
              <div className="text-[12px] text-gray-600">{timeLabel(session.start)} • by {session.teacher}</div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-white via-gray-200 to-white" />
          <div className="p-5 flex flex-col items-center gap-3">
            <QR value={payload} size={220} />
            <div className="text-[12px] text-gray-600 select-all">{payload}</div>
          </div>
          <div className="h-px bg-gradient-to-r from-white via-gray-200 to-white" />
          <div className="p-4 text-center text-[12px] text-gray-500">Show this at the entrance to mark attendance.</div>
        </div>
        <div className="mt-4 flex justify-center">
          <a href="#/scan" className="text-[13px] text-[var(--brand)] underline underline-offset-2">Go to scanner</a>
        </div>
      </main>
    </div>
  );
}
