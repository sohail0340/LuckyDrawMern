import { useEffect, useState, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminTransaction } from "@/lib/api";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, ImageIcon, X, Trash2 } from "lucide-react";

const STATUS_TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = typeof STATUS_TABS[number];

function StatusBadge({ s }: { s: string }) {
  const cls = s === "approved" ? "bg-emerald-500/15 text-emerald-400" : s === "rejected" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${cls}`}>{s}</span>;
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const REJECT_REASONS = ["Blurry screenshot", "Amount mismatch", "Duplicate submission", "Suspicious activity", "Other"];

export default function AdminPayments() {
  const [tab, setTab] = useState<Tab>("pending");
  const [txs, setTxs] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectCustom, setRejectCustom] = useState("");
  const [submitting, setSubmitting] = useState<string | number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const prevPendingCount = useRef(0);
  const [toastMsg, setToastMsg] = useState("");
  const [actionError, setActionError] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (tab !== "all") params.status = tab;
    adminApi.transactions(params).then(r => {
      setTxs(r.transactions);
      setTotal(r.total);
      if (tab === "pending" && prevPendingCount.current > 0 && r.total > prevPendingCount.current) {
        setToastMsg(`${r.total - prevPendingCount.current} new payment(s) pending!`);
        setTimeout(() => setToastMsg(""), 4000);
      }
      if (tab === "pending") prevPendingCount.current = r.total;
    }).catch(console.error).finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "pending") load();
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, load]);

  async function approve(id: string | number) {
    setSubmitting(id);
    await adminApi.approveTransaction(id).catch(console.error);
    setSubmitting(null);
    load();
  }

  async function reject() {
    if (!rejectId) return;
    setSubmitting(rejectId);
    const reason = rejectReason === "Other" ? rejectCustom : rejectReason;
    await adminApi.rejectTransaction(rejectId, reason).catch(console.error);
    setRejectId(null); setRejectReason(REJECT_REASONS[0]); setRejectCustom("");
    setSubmitting(null);
    load();
  }

  async function deletePayment(id: string | number) {
    const confirmed = window.confirm("Delete this payment record? This action cannot be undone.");
    if (!confirmed) return;
    setSubmitting(id);
    setActionError("");
    try {
      await adminApi.deleteTransaction(id);
      setTxs((prev) => prev.filter((t) => t.id !== String(id)));
      setTotal((prev) => Math.max(0, prev - 1));
      setToastMsg("Payment deleted successfully.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (err: any) {
      const msg = err?.message || "Failed to delete payment. Please try again.";
      setActionError(msg);
    }
    setSubmitting(null);
    load();
  }

  const pages = Math.ceil(total / 20);

  return (
    <AdminLayout title="Payment Approval">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#FFD700] text-black font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg">
          🔔 {toastMsg}
        </div>
      )}
      <div className="space-y-4">
        {actionError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <span className="flex-1">{actionError}</span>
            <button onClick={() => setActionError("")} className="text-red-400/70 hover:text-red-300">✕</button>
          </div>
        )}
        {/* Tabs */}
        <div className="flex gap-1 bg-[#111118] border border-white/8 p-1 rounded-xl w-fit">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[#FFD700] text-black" : "text-zinc-400 hover:text-white"}`}>
              {t}{t === "pending" && total > 0 && tab === "pending" ? ` (${total})` : ""}
            </button>
          ))}
          <button onClick={load} className="p-2 text-zinc-400 hover:text-white ml-1"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {/* Table */}
        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Draw</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3">Screenshot</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="w-6 h-6 text-[#FFD700] animate-spin mx-auto" /></td></tr>
                ) : txs.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-zinc-500">No payments</td></tr>
                ) : txs.map(tx => (
                  <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium text-xs">{tx.userName || "—"}</div>
                      <div className="text-zinc-500 text-[10px]">{tx.userPhone || tx.userEmail || "—"}</div>
                      {tx.userAddress ? (
                        <div className="text-zinc-500 text-[10px] mt-1 max-w-[240px] truncate">{tx.userAddress}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-bold">Rs. {tx.amountPkr.toLocaleString()}</div>
                      <div className="text-zinc-500 text-xs">{tx.tokensCount} token(s)</div>
                      {tx.paymentTransactionId ? (
                        <div className="text-zinc-400 text-[10px] mt-1">Txn: {tx.paymentTransactionId}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">{tx.drawName || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">{tx.paymentMethod}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{timeAgo(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      {tx.screenshotUrl ? (
                        <button onClick={() => setLightbox(tx.screenshotUrl!)} className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-[#FFD700]/40 transition-colors">
                          <img src={tx.screenshotUrl} alt="proof" className="w-full h-full object-cover" />
                        </button>
                      ) : <ImageIcon className="w-5 h-5 text-zinc-600" />}
                    </td>
                    <td className="px-4 py-3"><StatusBadge s={tx.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {tx.status === "pending" && (
                          <>
                            <button onClick={() => approve(tx.id)} disabled={submitting === tx.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
                              {submitting === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}Approve
                            </button>
                            <button onClick={() => setRejectId(tx.id)} disabled={submitting === tx.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" />Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deletePayment(tx.id)}
                          disabled={submitting === tx.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </div>
                      {tx.rejectionReason && <div className="text-red-400 text-[10px] mt-1">{tx.rejectionReason}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <span className="text-zinc-500 text-xs">Page {page} of {pages} — {total} total</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRejectId(null)} />
          <div className="relative bg-[#111118] border border-white/8 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Reject Payment</h3>
              <button onClick={() => setRejectId(null)}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-zinc-400 text-xs">Reason</label>
              <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none">
                {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
              {rejectReason === "Other" && (
                <textarea value={rejectCustom} onChange={e => setRejectCustom(e.target.value)} placeholder="Describe reason…" rows={3} className="w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none resize-none" />
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm">Cancel</button>
              <button onClick={reject} disabled={!!submitting} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold disabled:opacity-50">
                {submitting ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white"><X className="w-6 h-6" /></button>
          <img src={lightbox} alt="screenshot" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </AdminLayout>
  );
}
