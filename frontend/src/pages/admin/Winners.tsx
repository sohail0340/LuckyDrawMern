import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminWinner } from "@/lib/api";
import {
  Trophy, PhoneCall, Loader2, X,
  Copy, Check, ChevronRight, MapPin, Mail, Star,
  Hash, Search, Trash2, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="p-1 rounded-md hover:bg-white/10 transition-colors text-zinc-500 hover:text-white">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── WINNER DETAIL DRAWER ────────────────────────────────────────────────────
function WinnerDrawer({ winner, onClose, onUpdated }: { winner: AdminWinner; onClose: () => void; onUpdated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    prize: winner.prize || "",
    displayName: winner.displayName ?? winner.userName ?? "",
    displayCity: winner.displayCity ?? winner.userCity ?? "",
    displayPrize: winner.displayPrize ?? "",
    displayTokenLabel: winner.displayTokenLabel ?? (winner.winningTokenNumber != null ? `#${winner.winningTokenNumber}` : ""),
    displayDateLabel: winner.displayDateLabel ?? "",
    displayImageUrl: winner.displayImageUrl ?? "",
    displayAvatarUrl: winner.displayAvatarUrl ?? "",
    prizeDeliveryStatus: winner.prizeDeliveryStatus || "pending_contact",
    notes: winner.deliveryNotes || "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function saveWinner() {
    setSaving(true);
    try {
      await adminApi.updateWinner(winner.id, {
        prize: form.prize.trim() || null,
        displayName: form.displayName.trim() || null,
        displayCity: form.displayCity.trim() || null,
        displayPrize: form.displayPrize.trim() || null,
        displayTokenLabel: form.displayTokenLabel.trim() || null,
        displayDateLabel: form.displayDateLabel.trim() || null,
        displayImageUrl: form.displayImageUrl.trim() || null,
        displayAvatarUrl: form.displayAvatarUrl.trim() || null,
        notes: form.notes.trim() || null,
      });
      await adminApi.updateDelivery(winner.id, form.prizeDeliveryStatus, form.notes.trim() || undefined);
      onUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save winner";
      window.alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File) {
    const token = localStorage.getItem("cld_token") ?? "";
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`/api/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Upload failed");
      }
      const data = await res.json();
      if (data?.url) {
        setForm(f => ({ ...f, displayImageUrl: data.url }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      window.alert(msg);
    }
  }

  async function deleteWinner() {
    const confirmed = window.confirm("Delete this winner record? This action cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await adminApi.deleteWinner(winner.id);
      onUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete winner";
      window.alert(message);
    } finally {
      setDeleting(false);
    }
  }

  const inputClass = "w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/35 placeholder:text-zinc-600";
  const labelClass = "text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="relative bg-[#0c0c18] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/25 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold leading-tight truncate">{winner.userName || "Anonymous"}</h3>
              <p className="text-zinc-500 text-xs truncate">{winner.drawName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteWinner}
              disabled={deleting}
              className="h-8 px-2.5 flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors text-xs"
              title="Delete winner"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-colors">
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl divide-y divide-white/5">
            {winner.userPhone && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <PhoneCall className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-white text-sm flex-1 font-mono">{winner.userPhone}</span>
                <CopyBtn text={winner.userPhone} />
              </div>
            )}
            {winner.userEmail && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-300 text-xs flex-1 truncate">{winner.userEmail}</span>
                <CopyBtn text={winner.userEmail} />
              </div>
            )}
            {winner.userCity && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-300 text-xs flex-1">{winner.userCity}</span>
              </div>
            )}
            {(winner.userAddress || winner.address) && (
              <div className="flex items-start gap-3 px-4 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span className="text-zinc-400 text-xs flex-1 leading-relaxed">{winner.userAddress || winner.address}</span>
                <CopyBtn text={winner.userAddress || winner.address || ""} />
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Star className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
              <span className="text-zinc-400 text-xs flex-1">Prize</span>
              <span className="text-[#FFD700] text-xs font-bold">{winner.prize || "—"}</span>
            </div>
            {winner.winningTokenNumber != null && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Hash className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-400 text-xs flex-1">Winning Token</span>
                <span className="text-zinc-300 text-[11px] font-mono">#{winner.winningTokenNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Trophy className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="text-zinc-400 text-xs flex-1">Draw date</span>
              <span className="text-zinc-300 text-[11px] font-mono">{fmtDate(winner.joinedAt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className={labelClass}>Public name</p>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} className={inputClass} placeholder="Winner name shown on the site" />
            </div>
            <div>
              <p className={labelClass}>Public city</p>
              <input value={form.displayCity} onChange={e => setForm(f => ({ ...f, displayCity: e.target.value }))} className={inputClass} placeholder="City shown on the site" />
            </div>
            <div>
              <p className={labelClass}>Prize text</p>
              <input value={form.displayPrize} onChange={e => setForm(f => ({ ...f, displayPrize: e.target.value }))} className={inputClass} placeholder="Prize shown on the winner card" />
            </div>
            <div>
              <p className={labelClass}>Card image</p>
              <div className="flex items-center gap-3">
                {form.displayImageUrl ? (
                  <img src={form.displayImageUrl} alt="card" className="w-24 h-14 object-cover rounded-md border border-white/6" />
                ) : (
                  <div className="w-24 h-14 bg-white/[0.02] rounded-md border border-white/6 flex items-center justify-center text-zinc-600 text-xs">No image</div>
                )}
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadFile(f);
                      // reset input
                      e.currentTarget.value = "";
                    }}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/8 text-sm text-zinc-200 hover:bg-white/6">Upload</button>
                  {form.displayImageUrl && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, displayImageUrl: "" }))} className="px-3 py-2 rounded-lg border border-white/8 text-sm text-zinc-400 hover:bg-white/6">Clear</button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className={labelClass}>Avatar image URL</p>
              <input value={form.displayAvatarUrl} onChange={e => setForm(f => ({ ...f, displayAvatarUrl: e.target.value }))} className={inputClass} placeholder="Optional avatar URL" />
            </div>
            <div>
              <p className={labelClass}>Token label</p>
              <input value={form.displayTokenLabel} onChange={e => setForm(f => ({ ...f, displayTokenLabel: e.target.value }))} className={inputClass} placeholder="#123456 or custom label" />
            </div>
            <div>
              <p className={labelClass}>Date label</p>
              <input value={form.displayDateLabel} onChange={e => setForm(f => ({ ...f, displayDateLabel: e.target.value }))} className={inputClass} placeholder="Example: 5 May 2026" />
            </div>
            <div>
              <p className={labelClass}>Delivery status</p>
              <select value={form.prizeDeliveryStatus} onChange={e => setForm(f => ({ ...f, prizeDeliveryStatus: e.target.value }))} className={inputClass}>
                <option value="pending_contact">Pending contact</option>
                <option value="contacted">Contacted</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Notes</p>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={4}
                placeholder="Add internal notes about this winner…"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={saveWinner}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-[#FFD700] text-black font-bold text-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<AdminWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminWinner | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    adminApi.winners().then(setWinners).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = winners.filter(w => {
    const q = search.toLowerCase();
    return !q || [w.displayName, w.userName, w.userPhone, w.displayCity, w.userCity, w.drawName, w.displayPrize, w.prize].some(v => v?.toLowerCase().includes(q));
  });

  return (
    <AdminLayout title="Winner Management">
      <div className="space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, city or draw…"
            className="w-full bg-[#111118] border border-white/8 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-white/20 placeholder:text-zinc-600" />
        </div>

        {/* Winners list */}
        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#FFD700] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No winners found</p>
              <p className="text-sm mt-1 text-zinc-600">Try adjusting your search</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(w => (
                <div key={w.id}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  onClick={() => setSelected(w)}>
                  <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/25 flex items-center justify-center shrink-0">
                    <Trophy className="w-4.5 h-4.5 text-[#FFD700]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{w.displayName || w.userName || "Anonymous"}</span>
                      {(w.displayCity || w.userCity) && <span className="text-zinc-600 text-xs">· {w.displayCity || w.userCity}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-zinc-500 text-xs truncate max-w-[160px]">{w.drawName}</span>
                      {(w.displayPrize || w.prize) && <span className="text-[#FFD700]/70 text-[10px] font-bold truncate max-w-[100px]">· {w.displayPrize || w.prize}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <WinnerDrawer
            winner={selected}
            onClose={() => setSelected(null)}
            onUpdated={() => { load(); setSelected(null); }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
