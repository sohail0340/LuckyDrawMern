import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreditCard, CheckCircle2, AlertCircle, XCircle, Upload, Loader2, Receipt } from "lucide-react";
import { userApi, type ApiTransaction } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: "Approved", color: "text-emerald-400", icon: CheckCircle2 },
  pending:  { label: "Pending",  color: "text-[#FFD700]",   icon: AlertCircle },
  rejected: { label: "Rejected", color: "text-red-400",     icon: XCircle },
};

export default function Transactions() {
  const [txns, setTxns] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    userApi.transactions().then(setTxns).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div></DashboardLayout>;

  const filtered = filter === "all" ? txns : txns.filter((t) => t.status === filter);
  const approvedTotal = txns
    .filter((t) => t.status === "approved")
    .reduce((s, t) => s + parseInt(t.amount.replace(/[^\d]/g, "")), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">My Transactions</h1>
          <p className="text-zinc-500 text-sm mt-1">Track all your payment history and proof submissions.</p>
        </div>

        {txns.length === 0 ? (
          <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center">
            <Receipt className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-white font-semibold text-base">No transactions yet</p>
            <p className="text-zinc-500 text-sm mt-1">Your payment history will appear here once you join a draw</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(["all", "approved", "pending", "rejected"] as const).map((s) => {
                const count = s === "all" ? txns.length : txns.filter((t) => t.status === s).length;
                const colors: Record<string, string> = { all: "text-white", approved: "text-emerald-400", pending: "text-[#FFD700]", rejected: "text-red-400" };
                return (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`bg-[#111118] border rounded-2xl p-4 text-center transition-all ${filter === s ? "border-[#FFD700]/30" : "border-white/8 hover:border-white/15"}`}>
                    <CreditCard className={`w-5 h-5 mx-auto mb-2 ${colors[s]}`} />
                    <div className={`text-2xl font-bold ${colors[s]}`}>{count}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 capitalize">{s === "all" ? "Total" : s}</div>
                  </button>
                );
              })}
            </div>

              <div className="bg-[#111118] border border-[#FFD700]/20 rounded-2xl px-5 py-3 flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total Amount Paid (Approved)</span>
                <span className="text-[#FFD700] font-bold text-lg">Rs. {(approvedTotal ?? 0).toLocaleString()}</span>
              </div>

            <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">No {filter} transactions found.</div>
              ) : (
                filtered.map((t) => {
                  const S = STATUS_MAP[t.status] || STATUS_MAP.pending;
                  return (
                    <div key={t.id} className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors items-start sm:items-center">
                      <span className="text-zinc-400 font-mono text-xs">{t.id}</span>
                      <div><p className="text-white text-sm font-medium">{t.draw}</p><p className="text-zinc-500 text-xs">{t.tokens} token{t.tokens > 1 ? "s" : ""}</p></div>
                      <span className="text-white text-sm font-semibold">{t.amount}</span>
                      <span className="text-zinc-400 text-xs">{t.method}</span>
                      <span className="text-zinc-500 text-xs">{t.date}</span>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-xs font-semibold ${S.color}`}>
                          <S.icon className="w-3.5 h-3.5" />{S.label}
                        </span>
                        {t.status === "rejected" && (
                          <button className="flex items-center gap-1 text-[10px] text-[#FFD700] border border-[#FFD700]/30 rounded-lg px-2 py-0.5 hover:bg-[#FFD700]/10 transition-colors">
                            <Upload className="w-3 h-3" />Re-upload
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
