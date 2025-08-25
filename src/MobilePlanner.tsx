import React from "react";
import { BRAND, ICONS, Session, seedWeek, dayTitle, timeLabel, classNames } from "./data";

import { FRIENDS } from "./data";

// --- Components ---
const Pill: React.FC<{ active?: boolean; children: React.ReactNode; onClick?: () => void }> = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={classNames(
      "min-w-10 h-10 px-3 mx-1 rounded-full text-sm font-semibold",
      active ? "bg-[var(--brand)] text-white shadow" : "bg-white text-gray-700 border border-gray-200"
    )}
    aria-pressed={!!active}
  >
    {children}
  </button>
);

const Badge: React.FC<{ tone?: "ok" | "warn" | "sold"; children: React.ReactNode }> = ({ tone = "ok", children }) => (
  <span
    className={classNames(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      tone === "warn" && "bg-amber-50 text-amber-700 border border-amber-200",
      tone === "ok" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
      tone === "sold" && "bg-gray-100 text-gray-600 border border-gray-200"
    )}
  >
    {children}
  </span>
);

const BookButton: React.FC<{ booked: boolean; disabled?: boolean; onClick: () => void }> = ({ booked, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={classNames(
      "px-4 h-10 rounded-full text-sm font-semibold transition active:scale-[.98]",
      disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : booked ? "bg-emerald-600 text-white" : "bg-[var(--brand)] text-white"
    )}
    aria-label={booked ? "Booked" : "Book"}
  >
    {booked ? "booked" : "book"}
  </button>
);

const Modal: React.FC<{ open: boolean; onClose: () => void; title?: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-xl p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-[13px] text-gray-500 mt-1">Here are the details for this session. You can customise this copy later.</p>
          </div>
          <button className="text-gray-500" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mt-4 text-sm text-gray-700 space-y-3">{children}</div>
      </div>
    </div>
  );
};

export default function MobilePlanner() {
  const { days, sessions } = React.useMemo(seedWeek, []);
  const [activeDay, setActiveDay] = React.useState(days[0].key);
  const [booked, setBooked] = React.useState<Record<string, boolean>>({});
  const [detailsFor, setDetailsFor] = React.useState<Session | null>(null);

  const daySessions = sessions
    .filter((s) => s.dayKey === activeDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  const selectedCount = Object.values(booked).filter(Boolean).length;

  const toggleBook = (s: Session) => {
    if (s.slotsLeft === 0) return;
    setBooked((prev) => ({ ...prev, [s.id]: !prev[s.id] }));
  };

  const activeDate = days.find((d) => d.key === activeDay)!.date;
  const title = dayTitle(activeDate);

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={{ ["--brand" as any]: BRAND } as React.CSSProperties}
    >
      {/* App header */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[var(--brand)] to-[var(--brand)]/90 text-white">
        <div className="px-4 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <button aria-label="Go back" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center" onClick={() => (window.location.hash = "#/")}>←</button>
            <div className="text-[15px]">
              <div className="opacity-90">plan</div>
              <div className="text-xl font-semibold">nikita’s schedule</div>
            </div>
            <div className="ml-auto w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold">N</div>
          </div>
        </div>

        {/* Weekday scroller */}
        <div className="px-3 pb-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center">
            {days.map(({ key, date }) => (
              <Pill key={key} active={key === activeDay} onClick={() => setActiveDay(key)}>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] opacity-90">{date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</span>
                  <span className="text-sm">{date.getDate()}</span>
                </div>
              </Pill>
            ))}
          </div>
        </div>
      </header>

      {/* Day title */}
      <div className="px-4 pt-4 text-gray-700">
        <div className="text-xs uppercase tracking-wide text-gray-500">{activeDate.toLocaleDateString(undefined, { weekday: "long" })}</div>
        <h2 className="text-lg font-semibold">{title.full}</h2>
      </div>

      {/* Sessions */}
      <main className="px-4 pb-28">
        <div className="mt-3 space-y-10">
          {daySessions.length === 0 && (
            <div className="text-center text-gray-500 py-16">No sessions for this day.</div>
          )}

          {daySessions.map((s) => {
            const bookedState = !!booked[s.id];
            const soldOut = s.slotsLeft === 0;
            const warn = s.slotsLeft > 0 && s.slotsLeft <= 3 && !bookedState;
            const friends = s.friendIds
              .map((id) => FRIENDS.find((f) => f.id === id)!)
              .filter(Boolean);

            return (
              <section key={s.id} aria-label={`${s.title} at ${timeLabel(s.start)}`}>
                <div className="text-[13px] text-gray-500 mb-2">
                  <span className="font-medium text-gray-700">{timeLabel(s.start)}</span>
                  <span className="mx-1">•</span>
                  <span>{s.durationMin} mins</span>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl select-none">
                    {ICONS[s.title] ?? "🎯"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[15px] truncate capitalize">{s.title}</h3>
                      {soldOut ? (
                        <Badge tone="sold">sold out</Badge>
                      ) : warn ? (
                        <Badge tone="warn">{s.slotsLeft} {s.slotsLeft === 1 ? "slot" : "slots"} left</Badge>
                      ) : (
                        <Badge tone="ok">open</Badge>
                      )}
                    </div>

                    <div className="text-[12px] text-gray-600 mt-0.5">by {s.teacher}</div>

                    <button
                      className="text-[13px] text-[var(--brand)] underline underline-offset-2 mt-1"
                      onClick={() => setDetailsFor(s)}
                    >
                      view details
                    </button>

                    {friends.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {friends.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white bg-amber-50 text-[13px]"
                              title={f.name}
                              aria-label={f.name}
                            >
                              {f.emoji ?? f.name[0]}
                            </span>
                          ))}
                        </div>
                        <div className="text-[12px] text-gray-600">
                          {friends.length === 1 ? `${friends[0].name} is going` : `${friends.length} friends going`}
                        </div>
                      </div>
                    )}
                  </div>

                  <BookButton booked={bookedState} disabled={soldOut} onClick={() => toggleBook(s)} />
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Sticky footer bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-4 mb-4 rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold">{selectedCount} {selectedCount === 1 ? "session" : "sessions"} selected</div>
              <div className="text-[12px] text-gray-500">Tap Continue to confirm your picks</div>
            </div>
            <button
              className={classNames(
                "px-5 h-11 rounded-xl text-sm font-semibold",
                selectedCount ? "bg-[var(--brand)] text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
              aria-disabled={!selectedCount}
              onClick={() => {
                if (!selectedCount) return;
                // Persist bookings and navigate home; Home will show upcoming tickets
                const selectedIds = Object.entries(booked).filter(([, v]) => v).map(([id]) => id);
                const selected = sessions.filter((s) => selectedIds.includes(s.id));
                // Save to localStorage under 'bookings'
                const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
                const now = new Date().toISOString();
                const newOnes = selected.map((s) => ({
                  id: `b:${s.id}`,
                  sessionId: s.id,
                  createdAt: now,
                  attendedAt: null as string | null,
                }));
                // avoid duplicates by sessionId
                const mergedBySessionId: Record<string, any> = {};
                [...existing, ...newOnes].forEach((b: any) => {
                  mergedBySessionId[b.sessionId] = mergedBySessionId[b.sessionId] || b;
                });
                const merged = Object.values(mergedBySessionId);
                localStorage.setItem("bookings", JSON.stringify(merged));
                window.location.hash = "#/";
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </footer>

      {/* Details modal */}
      <Modal open={!!detailsFor} onClose={() => setDetailsFor(null)} title={detailsFor?.title}>
        {detailsFor && (
          <>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div>
                <div className="text-gray-500">Time</div>
                <div className="font-medium">{timeLabel(detailsFor.start)} – {timeLabel(detailsFor.end)}</div>
              </div>
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="font-medium">{detailsFor.durationMin} mins</div>
              </div>
              <div>
                <div className="text-gray-500">Slots</div>
                <div className="font-medium">{detailsFor.slotsLeft || 0} left</div>
              </div>
              <div>
                <div className="text-gray-500">Age group</div>
                <div className="font-medium">3–6 yrs</div>
              </div>
              <div>
                <div className="text-gray-500">Teacher</div>
                <div className="font-medium">{detailsFor.teacher}</div>
              </div>
            </div>
            <hr className="my-3" />
            <p>
              Build skills through hands‑on activities. Bring a water bottle. Free cancellation up to 24h before the class.
              Instructors rotate per centre; actual teacher name shows after booking.
            </p>
            {detailsFor.friendIds.length > 0 && (
              <div className="mt-3">
                <div className="text-[13px] text-gray-500 mb-1">Friends attending</div>
                <div className="flex flex-wrap gap-2">
                  {detailsFor.friendIds.map((id) => {
                    const f = FRIENDS.find((x) => x.id === id)!;
                    return (
                      <div key={id} className="flex items-center gap-2 px-2 py-1 rounded-full border border-gray-200 bg-gray-50">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border text-[13px]">{f.emoji ?? f.name[0]}</span>
                        <span className="text-[13px]">{f.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                className="px-5 h-11 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white"
                onClick={() => {
                  if (detailsFor) toggleBook(detailsFor);
                  setDetailsFor(null);
                }}
              >
                {booked[detailsFor.id] ? "Update booking" : "Book this slot"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Global styles for brand var fallback */}
      <style>{`:root{--brand:${BRAND}}`}</style>
    </div>
  );
}
