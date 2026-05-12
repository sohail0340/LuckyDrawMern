import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminContactMessage, type AdminContactResponse } from "@/lib/api";
import {
  MessageSquare, Mail, Phone, Clock, CheckCircle2, XCircle,
  RefreshCw, Trash2, ChevronDown, Eye, ExternalLink, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  replied: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const SUBJECT_LABELS: Record<string, string> = {
  payment: "Payment Issue",
  token: "Token Not Received",
  draw: "Draw Question",
  referral: "Referral Problem",
  other: "Other",
};

export default function AdminSupportTickets() {
  const [data, setData] = useState<AdminContactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<AdminContactMessage | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const tickets = data?.messages ?? data?.contacts ?? [];

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.contactMessages(filter !== "all" ? { status: filter } : {});
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: string | number, status: string, adminNotes?: string) {
    setSaving(true);
    try {
      await adminApi.updateContactMessage(id, { status, adminNotes: adminNotes ?? notes });
      await load();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, adminNotes: adminNotes ?? notes } : null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string | number) {
    if (!confirm("Delete this ticket permanently?")) return;
    setDeleting(String(id));
    try {
      await adminApi.deleteContactMessage(id);
      if (selected?.id === id) setSelected(null);
      await load();
    } finally { setDeleting(null); }
  }

  return (
    <AdminLayout title="Support Tickets">
      <div className="space-y-5">
        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tickets", value: data?.total ?? 0, icon: MessageSquare, color: "text-primary" },
            { label: "Open", value: data?.openCount ?? 0, icon: AlertCircle, color: "text-amber-400" },
            { label: "Replied", value: (data?.messages ?? []).filter(m => m.status === "replied").length, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Closed", value: (data?.messages ?? []).filter(m => m.status === "closed").length, icon: XCircle, color: "text-zinc-400" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <s.icon className={`w-6 h-6 ${s.color} shrink-0`} />
              <div>
                <div className="text-white font-bold text-xl leading-none">{s.value}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: message list */}
          <div className="lg:w-[420px] shrink-0 space-y-3">
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {["all", "open", "in_progress", "replied", "closed"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === f ? "bg-primary/15 border-primary/40 text-primary" : "bg-card border-white/8 text-zinc-400 hover:text-white hover:border-white/20"}`}
                >
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <button onClick={load} className="ml-auto p-1.5 text-zinc-400 hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="text-center text-zinc-500 py-12">Loading…</div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-zinc-500 py-12">No tickets found</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => { setSelected(msg); setNotes(msg.adminNotes || ""); }}
                    className={`w-full text-left bg-card border rounded-2xl p-4 transition-all hover:border-primary/30 ${selected?.id === msg.id ? "border-primary/50 bg-primary/5" : "border-white/8"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-white text-sm truncate">{msg.name}</span>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[msg.status] || STATUS_STYLES.open}`}>
                        {msg.status === "in_progress" ? "In Progress" : msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-zinc-400 text-xs mb-1">
                      {SUBJECT_LABELS[msg.subject ?? ""] || msg.subject}
                    </div>
                    <div className="text-zinc-500 text-xs truncate mb-2">{msg.message}</div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(msg.createdAt)}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{msg.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-card border border-white/8 rounded-2xl">
                <div className="text-center text-zinc-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a ticket to view details</p>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-white/8 rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white font-bold text-lg">{selected.name}</h2>
                    <div className="text-zinc-400 text-sm mt-0.5">{SUBJECT_LABELS[selected.subject ?? ""] || selected.subject}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[selected.status] || STATUS_STYLES.open}`}>
                      {selected.status === "in_progress" ? "In Progress" : selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </span>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      disabled={deleting === String(selected.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Email</div>
                    <a href={`mailto:${selected.email}`} className="text-sm text-primary flex items-center gap-1 hover:underline truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />{selected.email}
                    </a>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Phone</div>
                    <a href={`tel:${selected.phone}`} className="text-sm text-white flex items-center gap-1 hover:text-primary truncate">
                      <Phone className="w-3.5 h-3.5 shrink-0" />{selected.phone}
                    </a>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Message</div>
                  <div className="bg-black/30 rounded-xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                {/* Screenshot */}
                {selected.screenshotUrl && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Screenshot</div>
                    <a href={selected.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="w-4 h-4" />View Screenshot
                    </a>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Admin Notes (internal)</div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add private notes about this ticket..."
                    className="w-full bg-black/30 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:outline-none resize-none"
                  />
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { status: "in_progress", label: "Mark In Progress", color: "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25" },
                    { status: "replied", label: "Mark Replied", color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" },
                    { status: "closed", label: "Close Ticket", color: "bg-zinc-500/15 border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/25" },
                    { status: "open", label: "Reopen", color: "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25" },
                  ].filter(a => a.status !== selected.status).map(a => (
                    <button
                      key={a.status}
                      disabled={saving}
                      onClick={() => updateStatus(selected.id, a.status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${a.color}`}
                    >
                      {saving ? "Saving…" : a.label}
                    </button>
                  ))}
                  <button
                    disabled={saving}
                    onClick={() => updateStatus(selected.id, selected.status, notes)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all ml-auto"
                  >
                    {saving ? "Saving…" : "Save Notes"}
                  </button>
                </div>

                <div className="text-[10px] text-zinc-600">
                  Submitted {timeAgo(selected.createdAt)} — {new Date(selected.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
