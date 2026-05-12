import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Bell, CreditCard, Trophy, Ticket, Info, Loader2 } from "lucide-react";
import { userApi, type ApiNotification } from "@/lib/api";

type NType = "payment" | "win" | "draw" | "system";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  payment: { label: "Payments", icon: CreditCard, color: "text-sky-400",     bg: "bg-sky-500/10" },
  win:     { label: "Wins",     icon: Trophy,     color: "text-[#FFD700]",   bg: "bg-[#FFD700]/10" },
  draw:    { label: "Draws",    icon: Ticket,     color: "text-emerald-400", bg: "bg-emerald-500/10" },
  system:  { label: "System",   icon: Info,       color: "text-zinc-400",    bg: "bg-white/5" },
};

function NotifIcon({ type, read }: { type: string; read: boolean }) {
  const c = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  return (
    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${read ? "opacity-60" : ""}`}>
      <c.icon className={`w-4 h-4 ${c.color}`} />
    </div>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | NType>("all");

  useEffect(() => {
    userApi.notifications().then(setNotifs).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div></DashboardLayout>;

  const unread = notifs.filter((n) => !n.read).length;
  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.type === filter);

  async function markRead(id: string) {
    const notificationId = Number(id);
    if (!Number.isFinite(notificationId)) return;
    await userApi.markNotificationRead(notificationId).catch(() => null);
    setNotifs((prev) => prev.map((n) => String(n.id) === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await userApi.markAllRead().catch(() => null);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              Notifications
              {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unread}</span>}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Stay updated with draws, payments, and wins.</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[#FFD700] text-xs font-semibold hover:underline">Mark all as read</button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "payment", "win", "draw", "system"] as const).map((f) => {
            const count = f === "all" ? notifs.length : notifs.filter((n) => n.type === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30" : "text-zinc-400 border border-white/8 hover:text-white"}`}>
                {f !== "all" && (() => { const C = TYPE_CONFIG[f]; return <C.icon className="w-3 h-3" />; })()}
                <span className="capitalize">{f === "all" ? "All" : TYPE_CONFIG[f]?.label ?? f}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          {notifs.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-white text-sm font-medium">No notifications yet</p>
              <p className="text-zinc-500 text-xs mt-1">You'll be notified about payments, draw results, and wins</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No notifications in this category.</p>
            </div>
          ) : (
            filtered.map((n) => (
              <div key={n.id} onClick={() => markRead(String(n.id))}
                className={`flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 transition-colors cursor-pointer ${!n.read ? "bg-[#FFD700]/3 hover:bg-[#FFD700]/5" : "hover:bg-white/3"}`}>
                <NotifIcon type={n.type} read={n.read} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${n.read ? "text-zinc-300" : "text-white"}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#FFD700] shrink-0" />}
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{n.message}</p>
                </div>
                <span className="text-zinc-600 text-xs shrink-0 mt-0.5">{n.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
