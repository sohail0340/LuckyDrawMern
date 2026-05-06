import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";

const AVATARS = [avatar1, avatar2, avatar3, avatar4];

type FeedEvent =
  | { type: "join"; name: string; city: string; draw: string; avatar: string; minutesAgo: number }
  | { type: "won"; name: string; prize: string; avatar: string; minutesAgo: number };

const BASE_FEED: FeedEvent[] = [
  { type: "join", name: "Ali", city: "Lahore",     draw: "Bike Draw",    avatar: AVATARS[0], minutesAgo: 1 },
  { type: "won",  name: "Usman",                   prize: "Rs. 50,000",  avatar: AVATARS[1], minutesAgo: 3 },
  { type: "join", name: "Zainab", city: "Karachi", draw: "Car Draw",     avatar: AVATARS[2], minutesAgo: 5 },
  { type: "won",  name: "Ahmed",                   prize: "Honda 125 Bike", avatar: AVATARS[3], minutesAgo: 8 },
  { type: "join", name: "Sara", city: "Islamabad", draw: "Cash Draw",    avatar: AVATARS[0], minutesAgo: 11 },
  { type: "won",  name: "Ayesha",                  prize: "Rs. 1,00,000",avatar: AVATARS[1], minutesAgo: 14 },
  { type: "join", name: "Bilal", city: "Rawalpindi", draw: "Bike Draw",  avatar: AVATARS[2], minutesAgo: 17 },
  { type: "won",  name: "Fatima",                  prize: "Rs. 25,000",  avatar: AVATARS[3], minutesAgo: 20 },
  { type: "join", name: "Hassan", city: "Multan",  draw: "Car Draw",     avatar: AVATARS[0], minutesAgo: 23 },
  { type: "join", name: "Sana", city: "Peshawar",  draw: "Cash Draw",    avatar: AVATARS[1], minutesAgo: 26 },
  { type: "won",  name: "Rizwan",                  prize: "Toyota Corolla", avatar: AVATARS[2], minutesAgo: 29 },
  { type: "join", name: "Kamran", city: "Faisalabad", draw: "Bike Draw", avatar: AVATARS[3], minutesAgo: 32 },
];

function formatTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "just now";
  if (minutesAgo === 1) return "1m ago";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const h = Math.floor(minutesAgo / 60);
  return `${h}h ago`;
}

function FeedRow({ event }: { event: FeedEvent }) {
  const label =
    event.type === "join"
      ? `${event.name} from ${event.city}`
      : `${event.name} won`;
  const sub =
    event.type === "join"
      ? `just joined ${event.draw}`
      : event.prize;
  const highlight = event.type === "won";

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
      <img
        src={event.avatar}
        alt={event.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-white font-medium text-sm truncate">{label}</span>
        <span className={`text-xs truncate ${highlight ? "text-[#FFD700] font-semibold" : "text-zinc-400"}`}>
          {sub}
        </span>
      </div>
      <span className="text-[#FFD700] text-xs font-medium shrink-0">{formatTime(event.minutesAgo)}</span>
    </div>
  );
}

export function LiveActivity() {
  const [feed, setFeed] = useState<FeedEvent[]>(BASE_FEED);
  const [tick, setTick] = useState(0);

  // Every 60s age all timestamps by 1 minute
  useEffect(() => {
    const ageTimer = setInterval(() => {
      setFeed((prev) =>
        prev.map((e) => ({ ...e, minutesAgo: e.minutesAgo + 1 }))
      );
    }, 60_000);
    return () => clearInterval(ageTimer);
  }, []);

  // Every 8s inject a fresh random event at front, trim to 14 items
  useEffect(() => {
    const newEventTimer = setInterval(() => {
      setTick((t) => t + 1);
      setFeed((prev) => {
        const pool: FeedEvent[] = [
          { type: "join", name: "Nadia", city: "Lahore",     draw: "Cash Draw",    avatar: AVATARS[0], minutesAgo: 0 },
          { type: "won",  name: "Tariq",                     prize: "Rs. 75,000",  avatar: AVATARS[1], minutesAgo: 0 },
          { type: "join", name: "Imran", city: "Karachi",   draw: "Car Draw",      avatar: AVATARS[2], minutesAgo: 0 },
          { type: "won",  name: "Hina",                      prize: "Rs. 50,000",  avatar: AVATARS[3], minutesAgo: 0 },
          { type: "join", name: "Omer", city: "Islamabad",   draw: "Bike Draw",    avatar: AVATARS[0], minutesAgo: 0 },
          { type: "won",  name: "Meera",                     prize: "Honda 125 Bike", avatar: AVATARS[1], minutesAgo: 0 },
        ];
        const newEvent = pool[Math.floor(Math.random() * pool.length)];
        return [newEvent, ...prev].slice(0, 14);
      });
    }, 8_000);
    return () => clearInterval(newEventTimer);
  }, []);

  const doubled = [...feed, ...feed];
  const ROW_H = 64;
  const VISIBLE = 4;
  const containerH = ROW_H * VISIBLE;
  const totalH = feed.length * ROW_H;
  const durationSec = (feed.length * 3);

  return (
    <>
      <style>{`
        @keyframes liveScrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-${totalH}px); }
        }
        .live-feed-inner {
          animation: liveScrollUp ${durationSec}s linear infinite;
        }
        .live-feed-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-[#111118] border border-[#FFD700]/30 rounded-2xl w-full sm:w-[320px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-black/20">
          <Flame className="w-4 h-4 text-[#FFD700]" />
          <span className="text-[#FFD700] font-bold text-xs tracking-wider uppercase">Live Activity</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-[10px] font-semibold uppercase tracking-wide">Live</span>
          </span>
        </div>

        {/* Scrolling feed */}
        <div
          className="overflow-hidden relative"
          style={{ height: `${containerH}px` }}
        >
          {/* top fade */}
          <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-[#111118] to-transparent z-10 pointer-events-none" />
          {/* bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#111118] to-transparent z-10 pointer-events-none" />

          <div className="live-feed-inner" style={{ height: `${totalH * 2}px` }}>
            {doubled.map((event, idx) => (
              <div key={`${idx}-${tick}`} style={{ height: `${ROW_H}px` }} className="flex items-center">
                <FeedRow event={event} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
