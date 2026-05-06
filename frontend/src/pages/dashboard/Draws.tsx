import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Trophy, CheckCircle2, XCircle, Flame, Loader2,
  Ticket, Calendar, ImageIcon, ArrowRight, Target,
  Hash, Sparkles, Clock,
} from "lucide-react";
import { Link } from "wouter";
import { userApi, type ApiDrawsResponse, type ApiUserDraw } from "@/lib/api";
import { fixImageUrl } from "@/lib/imageUrl";

function DrawCard({ d, variant }: { d: ApiUserDraw; variant: "active" | "past" }) {
  const img = fixImageUrl(d.imageUrl);
  const progress = d.tokenLimit && d.tokensSold ? Math.min(100, Math.round((d.tokensSold / d.tokenLimit) * 100)) : null;
  const won = d.result === "won";
  const joinDate = new Date(d.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={`bg-[#111118] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,215,0,0.08)] ${variant === "past" && won ? "border-emerald-500/30 hover:border-emerald-500/50" : "border-white/8 hover:border-white/15"}`}>
      <div className="flex gap-0">
        {/* Image column */}
        <div className="w-28 sm:w-36 shrink-0 bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={d.name}
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-zinc-700 p-4">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[9px] text-center leading-tight">{d.category || "Draw"}</span>
            </div>
          )}
          {variant === "active" && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-bold text-red-300 uppercase tracking-wide">Live</span>
            </div>
          )}
          {variant === "past" && (
            <div className={`absolute top-2 left-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 ${won ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-zinc-800 border border-white/10"}`}>
              {won
                ? <><CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[9px] font-bold text-emerald-300 uppercase">Won</span></>
                : <><XCircle className="w-2.5 h-2.5 text-zinc-500" /><span className="text-[9px] font-bold text-zinc-500 uppercase">Ended</span></>
              }
            </div>
          )}
        </div>

        {/* Details column */}
        <div className="flex-1 min-w-0 p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{d.name}</p>
              {d.prize && (
                <p className="text-[#FFD700] text-xs font-semibold mt-0.5 truncate">{d.prize}</p>
              )}
            </div>
            {d.prizeValuePkr && (
              <div className="shrink-0 text-right">
                <div className="text-[#FFD700] font-bold text-sm">PKR {(d.prizeValuePkr ?? 0).toLocaleString()}</div>
                <div className="text-zinc-600 text-[10px]">prize value</div>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
              <Ticket className="w-3 h-3 text-[#FFD700]" />
              <span><span className="text-white font-semibold">{d.tokens}</span> tokens entered</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <span>Joined {joinDate}</span>
            </div>
            {d.category && (
              <div className="flex items-center gap-1 text-zinc-600 text-xs">
                <Hash className="w-3 h-3" />
                <span className="capitalize">{d.category}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress !== null && d.tokenLimit && d.tokensSold !== null && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                  <Target className="w-2.5 h-2.5" />
                  <span>{(d.tokensSold ?? 0).toLocaleString()} / {(d.tokenLimit ?? 0).toLocaleString()} tokens sold</span>
                </div>
                <span className={`text-[10px] font-bold ${progress >= 90 ? "text-red-400" : progress >= 70 ? "text-orange-400" : "text-zinc-400"}`}>
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progress >= 90 ? "bg-red-500" : progress >= 70 ? "bg-orange-400" : "bg-[#FFD700]"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Win result for past draws */}
          {variant === "past" && won && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 mb-2">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-300 font-bold text-xs">Congratulations! You won this draw.</p>
                {d.prize && <p className="text-emerald-500 text-[10px]">Prize: {d.prize}</p>}
              </div>
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
              {variant === "active"
                ? <><Clock className="w-2.5 h-2.5" /><span>Draw ongoing</span></>
                : <><Sparkles className="w-2.5 h-2.5" /><span>Draw completed</span></>
              }
            </div>
            {variant === "active" && (
              <Link href={`/draws/${d.drawId}`}>
                <button className="flex items-center gap-1 text-[#FFD700] text-xs font-semibold hover:text-yellow-300 transition-colors">
                  View Draw <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Draws() {
  const [data, setData] = useState<ApiDrawsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    userApi.draws().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const activeDraws = data?.activeDraws ?? [];
  const pastDraws = data?.pastDraws ?? [];
  const wonDraws = pastDraws.filter(d => d.result === "won");
  const totalTokens = [...activeDraws, ...pastDraws].reduce((s, d) => s + d.tokens, 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">My Draws</h1>
          <p className="text-zinc-500 text-sm mt-1">View your draw entries and results.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "Total Draws", value: activeDraws.length + pastDraws.length, gold: false },
            { icon: Flame, label: "Draws Won", value: wonDraws.length, gold: true },
            { icon: Ticket, label: "Total Entries", value: totalTokens, gold: false },
          ].map(s => (
            <div key={s.label} className="bg-[#111118] border border-white/8 rounded-2xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.gold ? "text-[#FFD700]" : "text-zinc-400"}`} />
              <div className={`text-2xl font-bold ${s.gold ? "text-[#FFD700]" : "text-white"}`}>{s.value}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111118] border border-white/8 rounded-2xl p-1 w-fit">
          {(["active", "past"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? "bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black" : "text-zinc-400 hover:text-white"}`}
            >
              {t === "active" ? `Active (${activeDraws.length})` : `Past (${pastDraws.length})`}
            </button>
          ))}
        </div>

        {/* Active draws */}
        {tab === "active" && (
          activeDraws.length === 0 ? (
            <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-white font-semibold text-base">No active draws yet</p>
              <p className="text-zinc-500 text-sm mt-1 mb-5">Browse live draws and enter to win big prizes</p>
              <Link href="/draws" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 transition-opacity">
                Browse Live Draws
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDraws.map(d => <DrawCard key={d.id} d={d} variant="active" />)}
            </div>
          )
        )}

        {/* Past draws */}
        {tab === "past" && (
          pastDraws.length === 0 ? (
            <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-white font-semibold text-base">No past draws yet</p>
              <p className="text-zinc-500 text-sm mt-1">Completed draws will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastDraws.map(d => <DrawCard key={d.id} d={d} variant="past" />)}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
