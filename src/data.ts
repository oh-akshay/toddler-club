// Shared data/types for sessions, friends, and seeding

export const BRAND = "#EF5D34";

export type Session = {
  id: string;
  title: string;
  start: string; // ISO time
  end: string; // ISO time
  durationMin: number;
  slotsLeft: number; // 0 = sold out
  dayKey: string; // yyyy-mm-dd
  teacher: string;
  friendIds: string[];
};

export type Booking = { id: string; sessionId: string; createdAt: string; attendedAt: string | null };

export type Friend = { id: string; name: string; emoji?: string };
export const FRIENDS: Friend[] = [
  { id: "aanya", name: "Aanya", emoji: "🦄" },
  { id: "kabir", name: "Kabir", emoji: "🦖" },
  { id: "maya", name: "Maya", emoji: "🦋" },
  { id: "zoya", name: "Zoya", emoji: "🐼" },
  { id: "arjun", name: "Arjun", emoji: "🦁" },
  { id: "ira", name: "Ira", emoji: "🐨" },
];

export const TEACHERS = ["Nithyashree", "Monia"] as const;

export const ICONS: Record<string, string> = {
  "sensory play": "🖐️",
  "movement & music": "💪",
  language: "💬",
  "logic play": "🧠",
};

function hashString(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) + h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const seedWeek = () => {
  const start = new Date("2025-08-25T00:00:00");
  const days: { key: string; date: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, date: d });
  }

  const S = (dayOffset: number, h: number, m: number, title: string, durationMin = 90, slotsLeft = 3): Session => {
    const day = new Date(start);
    day.setDate(start.getDate() + dayOffset);
    const begin = new Date(day);
    begin.setHours(h, m, 0, 0);
    const end = new Date(begin.getTime() + durationMin * 60000);
    const id = `${title}-${begin.toISOString()}`;
    const teacher = TEACHERS[hashString(id) % TEACHERS.length];
    const chosen = FRIENDS.filter((f) => (hashString(id + f.id) % 5) < 2).slice(0, 3);
    return {
      id,
      title,
      start: begin.toISOString(),
      end: end.toISOString(),
      durationMin,
      slotsLeft,
      dayKey: day.toISOString().slice(0, 10),
      teacher,
      friendIds: chosen.map((f) => f.id),
    };
  };

  const sessions: Session[] = [
    S(0, 11, 30, "sensory play", 90, 3),
    S(0, 11, 30, "movement & music", 90, 4),

    S(1, 11, 30, "language", 90, 5),
    S(1, 13, 30, "logic play", 90, 1),

    S(2, 11, 30, "sensory play", 90, 5),
    S(2, 13, 30, "movement & music", 90, 1),

    S(3, 11, 30, "sensory play", 90, 5),
    S(3, 13, 30, "movement & music", 90, 2),
    S(3, 14, 30, "language", 90, 5),
    S(3, 15, 0, "logic play", 90, 3),
  ];

  return { days, sessions };
};

export function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function dayTitle(date: Date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const mon = date.toLocaleDateString(undefined, { month: "short" });
  return { chip: weekday.slice(0, 2), full: `${weekday}, ${day} ${mon}` };
}

export function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
