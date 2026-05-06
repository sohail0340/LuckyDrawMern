import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminReferral, type AdminReferralsResponse } from "@/lib/api";
import { Share2, Coins, Trophy, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today"; if (d === 1) return "Yesterday"; return `${d}d ago`;
}

export default function AdminReferrals() {
  const [data, setData] = useState<AdminReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const load = () => { adminApi.referrals().then(setData).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  async function grant(id: number) {
    setActing(id);
    await adminApi.grantReferral(id).catch(console.error);
    setActing(null); load();
  }

  async function revoke(id: number) {
    if (!confirm("Revoke this referral reward?")) return;
    setActing(id);
    await adminApi.revokeReferral(id).catch(console.error);
    setActing(null); load();
  }

  return (
    <AdminLayout title="Referral Management">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Referrals", value: data?.total ?? 0, icon: Share2, color: "text-sky-400" },
              { label: "Tokens Credited", value: data?.totalTokensCredited ?? 0, icon: Coins, color: "text-[#FFD700]" },
              { label: "Top Referrer", value: data?.topReferrers[0]?.name || "—", icon: Trophy, color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#111118] border border-white/8 rounded-2xl p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main table */}
            <div className="lg:col-span-2 bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Referrer</th>
                    <th className="text-left px-4 py-3">Referred</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3">Reward</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(data?.referrals || []).length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-zinc-500">No referrals yet</td></tr>
                    ) : (data?.referrals || []).map(r => (
                      <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">{r.referrerName || "—"}</div>
                          <div className="text-zinc-500 text-xs">{r.referrerPhone || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">{r.referredName || "—"}</div>
                          <div className="text-zinc-500 text-xs">{r.referredPhone || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{timeAgo(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          {r.rewardGiven
                            ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" />Given</span>
                            : <span className="flex items-center gap-1 text-zinc-500 text-xs"><XCircle className="w-3.5 h-3.5" />Pending</span>}
                        </td>
                        <td className="px-4 py-3">
                          {!r.rewardGiven ? (
                            <button onClick={() => grant(r.id)} disabled={acting === r.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold disabled:opacity-50">
                              {acting === r.id ? "…" : "Grant"}
                            </button>
                          ) : (
                            <button onClick={() => revoke(r.id)} disabled={acting === r.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 font-semibold disabled:opacity-50">
                              {acting === r.id ? "…" : "Revoke"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 leaderboard */}
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-4">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#FFD700]" />Top Referrers</h3>
              <div className="space-y-3">
                {(data?.topReferrers || []).slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#FFD700] text-black" : i === 1 ? "bg-zinc-400 text-black" : i === 2 ? "bg-orange-700 text-white" : "bg-white/10 text-zinc-400"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{r.name || "Unknown"}</div>
                    </div>
                    <div className="text-[#FFD700] font-bold text-sm">{Number(r.count)}</div>
                  </div>
                ))}
                {(data?.topReferrers || []).length === 0 && <p className="text-zinc-500 text-xs text-center py-4">No referrers yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
