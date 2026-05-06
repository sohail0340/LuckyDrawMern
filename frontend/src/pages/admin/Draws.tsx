import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminDraw, type AdminParticipant } from "@/lib/api";
import { fixImageUrl } from "@/lib/imageUrl";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, Users, Zap, X, Car, Bike, Wallet, Smartphone,
  Flame, Eye, Ticket, Clock, Sparkles, Trophy, CheckCircle2, Loader2,
  ImageIcon, Calendar, Settings2, LayoutGrid, List,
  Upload, Check,
} from "lucide-react";

// ─── HELPERS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["cars", "bikes", "cash", "electronics"] as const;
type Cat = typeof CATEGORIES[number];
const STATUSES = ["draft", "active", "closed", "drawn"] as const;

const CAT_META: Record<Cat, { icon: typeof Car; label: string; type: string }> = {
  cars:        { icon: Car,        label: "Cars",        type: "Car Draw" },
  bikes:       { icon: Bike,       label: "Bikes",       type: "Bike Draw" },
  cash:        { icon: Wallet,     label: "Cash",        type: "Cash Draw" },
  electronics: { icon: Smartphone, label: "Electronics", type: "Electronics" },
};

const STATUS_COLORS: Record<string, string> = {
  draft:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  drawn:  "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtPkr(n: number) {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

interface DrawForm {
  name: string; category: string; prize: string;
  prizeValuePkr: string; tokenPricePkr: string; tokenLimit: string;
  imageUrl: string; status: string; startsAt: string; endsAt: string;
  badges: string[]; customCategory: string;
}
const EMPTY_FORM: DrawForm = {
  name: "", category: "cars", prize: "", prizeValuePkr: "",
  tokenPricePkr: "100", tokenLimit: "", imageUrl: "",
  status: "draft", startsAt: "", endsAt: "", badges: [], customCategory: "",
};

const PREDEFINED_BADGES: { key: string; label: string; cls: string; dot?: boolean }[] = [
  { key: "verified",    label: "Verified Draw", cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", dot: true },
  { key: "live-now",   label: "Live Now",       cls: "bg-red-500/10 border-red-500/30 text-red-400",     dot: true },
  { key: "hot",        label: "Hot 🔥",         cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { key: "new",        label: "New Draw",       cls: "bg-sky-500/10 border-sky-500/30 text-sky-400" },
  { key: "ending-soon",label: "Ending Soon",    cls: "bg-red-500/10 border-red-500/30 text-red-400",     dot: true },
  { key: "almost-full",label: "Almost Full",    cls: "bg-orange-500/10 border-orange-500/30 text-orange-400", dot: true },
];

function getBadgeChips(badges: string | null | undefined) {
  if (!badges) return null;
  const list = badges.split(",").map(b => b.trim()).filter(Boolean);
  return list.map(key => {
    const meta = PREDEFINED_BADGES.find(b => b.key === key);
    if (meta) return (
      <span key={key} className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
        {meta.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        {meta.label}
      </span>
    );
    return (
      <span key={key} className="inline-flex items-center gap-1.5 bg-zinc-500/10 border border-zinc-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
        {key}
      </span>
    );
  });
}

// ─── MINI COUNTDOWN ──────────────────────────────────────────────────────────
function MiniCountdown({ endsAt }: { endsAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const target = endsAt ? new Date(endsAt).getTime() : Date.now() + 6 * 24 * 3600 * 1000;
  const diff = Math.max(0, target - now);
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins  = Math.floor((diff / 60000) % 60);
  const secs  = Math.floor((diff / 1000) % 60);
  const segs  = [{ v: pad(days), l: "Days" }, { v: pad(hours), l: "Hrs" }, { v: pad(mins), l: "Min" }, { v: pad(secs), l: "Sec" }];
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 mb-4 flex items-center justify-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-[#FFD700] mr-1 shrink-0" />
      {segs.map((s, i) => (
        <div key={s.l} className="flex items-center gap-1.5">
          <div className="text-center min-w-[28px]">
            <div className="text-base font-bold font-mono text-white tabular-nums leading-none">{s.v}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">{s.l}</div>
          </div>
          {i < 3 && <span className="text-[#FFD700] font-bold text-base leading-none">:</span>}
        </div>
      ))}
    </div>
  );
}

// ─── DRAW CARD (exact replica of public card + admin overlay) ─────────────────
function DrawCard({
  draw, onEdit, onViewParticipants, onDelete, onPickWinner,
}: {
  draw: Partial<AdminDraw> & { name: string; category: string };
  onEdit?: () => void; onViewParticipants?: () => void;
  onDelete?: () => void; onPickWinner?: () => void;
}) {
  const cat    = (draw.category || "cars") as Cat;
  const isCustomCat = !(cat in CAT_META);
  const meta   = CAT_META[cat] ?? { icon: Settings2, label: cat || "Custom", type: `${cat || "Custom"} Draw` };
  const Icon   = meta.icon;
  const sold   = Number(draw.tokensSold ?? 0);
  const players = Number(draw.participantCount ?? 0);
  const limit  = Number(draw.tokenLimit ?? 1);
  const pct    = limit > 0 ? Math.round((sold / limit) * 100) : 0;
  const almostFull = pct >= 85;
  const isHot  = pct >= 70;

  const statusBadge = () => {
    if (almostFull)         return <span className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Almost Full</span>;
    if (draw.status === "active") return <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live Now</span>;
    if (draw.status === "draft")  return <span className="inline-flex items-center gap-1.5 bg-zinc-500/10 border border-zinc-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Draft</span>;
    if (draw.status === "closed") return <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">Closed</span>;
    if (draw.status === "drawn")  return <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400"><CheckCircle2 className="w-3 h-3" />Drawn</span>;
    return <span className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400"><Sparkles className="w-3 h-3" />New Draw</span>;
  };

  return (
    <div className="group bg-[#111118] border border-white/8 rounded-3xl p-6 hover:border-[#FFD700]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.08)] flex flex-col relative overflow-hidden">
      {/* Admin actions overlay — top right */}
      {(onEdit || onViewParticipants || onDelete || onPickWinner) && (
        <div className="absolute top-3 right-3 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {(draw.status === "active" || draw.status === "closed") && onPickWinner && (
            <button onClick={onPickWinner} title="Pick Winner" className="w-8 h-8 rounded-xl bg-[#FFD700] text-black flex items-center justify-center hover:opacity-90">
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}
          {onViewParticipants && (
            <button onClick={onViewParticipants} title="Participants" className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/15">
              <Users className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} title="Edit" className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/15">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete}
              title={draw.status === "draft" ? "Delete" : "Archive"}
              className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top badges — dynamic from draw.badges */}
      {(draw as any).badges ? (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {getBadgeChips((draw as any).badges)}
        </div>
      ) : (
        <div className="flex justify-between items-center mb-5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Verified Draw
          </div>
          {statusBadge()}
        </div>
      )}

      {/* Type + Hot */}
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/5 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium text-zinc-300 border border-white/10">
          <Icon className="w-3.5 h-3.5 text-[#FFD700]" />
          {meta.type}
        </div>
        {isHot && (
          <div className="flex items-center gap-1.5 text-[#FFD700] font-bold text-sm">
            <Flame className="w-4 h-4" />Hot
          </div>
        )}
      </div>

      {/* Image area */}
      <div className="h-44 flex items-center justify-center mb-5 relative rounded-2xl overflow-hidden bg-white/[0.02]">
        <div className="absolute inset-0 bg-[#FFD700]/5 blur-2xl group-hover:bg-[#FFD700]/15 transition-colors duration-500 rounded-full" />
        {fixImageUrl(draw.imageUrl) ? (
          <img src={fixImageUrl(draw.imageUrl)!} alt={draw.name} className="w-full h-full object-contain relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }} />
        ) : null}
        <div className={`${fixImageUrl(draw.imageUrl) ? "hidden" : "flex"} flex-col items-center justify-center gap-2 relative z-10 text-zinc-600`}>
          <ImageIcon className="w-10 h-10" /><span className="text-xs">No image yet</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-2">{draw.name || "Draw Title"}</h3>

      {/* Prize value + token price */}
      <div className="flex items-baseline gap-3 mb-5 flex-wrap">
        <span className="text-2xl font-bold text-[#FFD700]">
          {draw.prizeValuePkr ? fmtPkr(Number(draw.prizeValuePkr)) : "PKR —"}
        </span>
        <span className="text-xs text-zinc-400">
          PKR {draw.tokenPricePkr ?? "—"} / token
        </span>
      </div>

      {/* Info chips */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">Entries</div>
            <div className="text-xs font-bold text-emerald-400">Unlimited</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Per Token</div>
            <div className="text-xs font-bold text-white">PKR {draw.tokenPricePkr ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <MiniCountdown endsAt={draw.endsAt ?? null} />

      {/* Buttons */}
      <div className="space-y-2 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          {onViewParticipants && (
            <button onClick={onViewParticipants} className="w-full border border-white/15 hover:border-white/30 hover:bg-white/5 text-white h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors">
              <Users className="w-4 h-4" />{players} Players
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="w-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#FFD700]/20 transition-colors">
              <Edit2 className="w-4 h-4" />Edit Draw
            </button>
          )}
        </div>
        {(draw.status === "active" || draw.status === "closed") && onPickWinner && (
          <button onClick={onPickWinner}
            className="w-full h-11 rounded-xl bg-[#FFD700] text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(255,215,0,0.2)]">
            <Zap className="w-4 h-4" />Pick Winner Now
          </button>
        )}
        {draw.status === "drawn" && (
          <div className="w-full h-9 rounded-xl bg-purple-500/8 border border-purple-500/20 flex items-center justify-center gap-2 text-purple-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />Winner Selected
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IMAGE UPLOAD COMPONENT ───────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("cld_token");
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || !files[0]) return;
    uploadFile(files[0]);
  }

  return (
    <div>
      <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Prize Image</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/3 h-36 flex items-center justify-center group">
          <img src={value} alt="Prize" className="max-h-full max-w-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label className="cursor-pointer bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Change
              <input type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </label>
            <button onClick={() => onChange("")} className="bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      ) : (
        <label
          className={`block cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragging ? "border-yellow-400/70 bg-yellow-500/5" : "border-white/15 hover:border-yellow-400/40 hover:bg-white/3"
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-yellow-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <ImageIcon className="w-7 h-7" />
              <div>
                <span className="text-yellow-400 font-semibold text-sm">Click to upload</span>
                <span className="text-xs block mt-0.5">or drag & drop · JPG, PNG, WebP · Max 8 MB</span>
              </div>
            </div>
          )}
        </label>
      )}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

// ─── CREATE / EDIT SIDE PANEL ────────────────────────────────────────────────
function DrawPanel({ draw, onClose, onSave }: { draw?: AdminDraw | null; onClose: () => void; onSave: () => void }) {
  const existingBadges = draw?.badges ? draw.badges.split(",").map(b => b.trim()).filter(Boolean) : [];
  const isCustomCat = draw ? !CATEGORIES.includes(draw.category as Cat) : false;
  const [form, setForm] = useState<DrawForm>(draw ? {
    name: draw.name,
    category: isCustomCat ? "custom" : draw.category,
    customCategory: isCustomCat ? draw.category : "",
    prize: draw.prize,
    prizeValuePkr: String(draw.prizeValuePkr), tokenPricePkr: String(draw.tokenPricePkr),
    tokenLimit: String(draw.tokenLimit), imageUrl: draw.imageUrl || "",
    status: draw.status, startsAt: draw.startsAt?.slice(0, 16) ?? "",
    endsAt: draw.endsAt?.slice(0, 16) ?? "", badges: existingBadges,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function set<K extends keyof DrawForm>(k: K, v: DrawForm[K]) {
    setFormError(null);
    setForm(f => ({ ...f, [k]: v }));
  }

  const resolvedCategory = form.category === "custom" ? (form.customCategory || "custom") : form.category;

  function toggleBadge(key: string) {
    set("badges", form.badges.includes(key) ? form.badges.filter(b => b !== key) : [...form.badges, key]);
  }

  async function save() {
    setFormError(null);
    if (!form.name.trim()) { setFormError("Draw name is required."); return; }
    if (!form.prizeValuePkr || Number(form.prizeValuePkr) <= 0) { setFormError("Prize value (PKR) must be greater than 0."); return; }
    if (!form.tokenPricePkr || Number(form.tokenPricePkr) <= 0) { setFormError("Token price must be greater than 0."); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), category: resolvedCategory, prize: form.name.trim(),
        prizeValuePkr: Number(form.prizeValuePkr), tokenPricePkr: Number(form.tokenPricePkr),
        tokenLimit: 999999, imageUrl: form.imageUrl || null,
        status: form.status, badges: form.badges.join(","),
        startsAt: form.startsAt || null, endsAt: form.endsAt || null,
      };
      if (draw) await adminApi.updateDraw(draw.id, payload);
      else await adminApi.createDraw(payload);
      onSave();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save draw. Please try again.";
      setFormError(msg);
      console.error("Save draw error:", err);
    } finally {
      setSaving(false);
    }
  }

  const INP = "w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/40 placeholder:text-zinc-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6">
      <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-6xl bg-[#0d0d15] md:rounded-3xl border border-white/8 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{ height: "min(95vh, 880px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0 bg-[#0a0a12]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center shrink-0">
              {draw ? <Edit2 className="w-5 h-5 text-[#FFD700]" /> : <Plus className="w-5 h-5 text-[#FFD700]" />}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{draw ? "Edit Draw" : "Create New Draw"}</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Fill in the details below to {draw ? "update" : "create"} the draw</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !form.name}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Saving…" : draw ? "Update Draw" : "Create Draw"}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Error banner */}
        {formError && (
          <div className="flex items-center gap-3 mx-5 mt-3 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl shrink-0">
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm flex-1">{formError}</p>
            <button onClick={() => setFormError(null)} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* ── Form ── */}
          <div className="flex flex-col w-full overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a3a transparent" }}>
            <div className="p-6 space-y-7">

              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[10px] font-black text-[#FFD700]">1</span>
                  <h3 className="text-white text-sm font-bold tracking-wide">Basic Information</h3>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div>
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Draw Name <span className="text-[#FFD700]">*</span></label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} className={INP} placeholder="e.g. Toyota Corolla 2024" />
                </div>
                <div>
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2.5 block">Category <span className="text-[#FFD700]">*</span></label>
                  <div className="grid grid-cols-6 gap-2">
                    {CATEGORIES.map(c => {
                      const m = CAT_META[c];
                      return (
                        <button key={c} onClick={() => set("category", c)}
                          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border text-[11px] font-bold transition-all ${form.category === c ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.1)]" : "border-white/8 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/5"}`}>
                          <m.icon className="w-5 h-5" />
                          {m.label}
                        </button>
                      );
                    })}
                    <button onClick={() => set("category", "custom")}
                      className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border text-[11px] font-bold transition-all ${form.category === "custom" ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.1)]" : "border-white/8 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/5"}`}>
                      <Settings2 className="w-5 h-5" />
                      Custom
                    </button>
                  </div>
                  {form.category === "custom" && (
                    <input value={form.customCategory} onChange={e => set("customCategory", e.target.value)}
                      className={`${INP} mt-3`} placeholder="e.g. iPhone, Furniture, Land, Gold…" />
                  )}
                </div>
              </div>

              {/* Section 2: Pricing */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[10px] font-black text-[#FFD700]">2</span>
                  <h3 className="text-white text-sm font-bold tracking-wide">Pricing & Limits</h3>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Prize Value (PKR)</label>
                    <input type="number" value={form.prizeValuePkr} onChange={e => set("prizeValuePkr", e.target.value)} className={INP} placeholder="5,500,000" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Token Price (PKR)</label>
                    <input type="number" value={form.tokenPricePkr} onChange={e => set("tokenPricePkr", e.target.value)} className={INP} placeholder="100" />
                  </div>
                </div>
              </div>

              {/* Section 3: Image */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[10px] font-black text-[#FFD700]">3</span>
                  <h3 className="text-white text-sm font-bold tracking-wide">Prize Image</h3>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <ImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} />
              </div>

              {/* Section 4: Status & Schedule */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[10px] font-black text-[#FFD700]">4</span>
                  <h3 className="text-white text-sm font-bold tracking-wide">Status & Schedule</h3>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div>
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2.5 block">Draw Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => set("status", s)}
                        className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${form.status === s ? `${STATUS_COLORS[s]} border` : "border-white/8 text-zinc-500 hover:text-white hover:bg-white/5"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
                      <Calendar className="w-3.5 h-3.5" />Starts At
                    </label>
                    <input type="datetime-local" value={form.startsAt} onChange={e => set("startsAt", e.target.value)} className={INP} />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
                      <Calendar className="w-3.5 h-3.5" />Ends At
                    </label>
                    <input type="datetime-local" value={form.endsAt} onChange={e => set("endsAt", e.target.value)} className={INP} />
                  </div>
                </div>
              </div>

              {/* Section 5: Badges */}
              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[10px] font-black text-[#FFD700]">5</span>
                  <h3 className="text-white text-sm font-bold tracking-wide">Badges</h3>
                  <span className="text-zinc-600 text-xs">(optional)</span>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_BADGES.map(b => {
                    const active = form.badges.includes(b.key);
                    return (
                      <button key={b.key} onClick={() => toggleBadge(b.key)}
                        className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${active ? b.cls + " scale-105" : "border-white/10 text-zinc-500 hover:text-white hover:border-white/20"}`}>
                        {b.dot && active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        {active && <Check className="w-2.5 h-2.5" />}
                        {b.label}
                      </button>
                    );
                  })}
                </div>
                {form.badges.length > 0 && (
                  <button onClick={() => set("badges", [])} className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors">Clear all badges</button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/8 shrink-0 md:hidden bg-[#0a0a12]">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm font-semibold">Cancel</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Saving…" : draw ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PICK WINNER MODAL ────────────────────────────────────────────────────────
function PickWinnerModal({ draw, onClose, onComplete }: { draw: AdminDraw; onClose: () => void; onComplete: () => void }) {
  type Phase = "setup" | "loading" | "animating" | "revealing" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("setup");
  const [winnerCount, setWinnerCount] = useState(1);
  const [allNames, setAllNames] = useState<string[]>([]);
  const [winners, setWinners] = useState<Array<{ id?: number; name: string | null; phone: string | null; city: string | null; tokensUsed: number; tokenSlot: number; totalSlots: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [progress, setProgress] = useState(0);
  const [nameHistory, setNameHistory] = useState<string[]>([]);
  const progressRef = useRef(0);
  const namesRef = useRef<string[]>([]);
  const phaseRef = useRef<Phase>("setup");
  const selectionIdRef = useRef("");

  function startDraw() {
    phaseRef.current = "loading";
    setPhase("loading");
    Promise.all([
      adminApi.drawParticipants(draw.id),
      adminApi.triggerDraw(draw.id, winnerCount),
    ]).then(([parts, result]) => {
      const participantList = Array.isArray(parts) ? parts : [];
      const names = [...new Set(participantList.map(p => p.userName || p.userPhone || "Anonymous"))].filter(Boolean);
      namesRef.current = names.length > 0 ? names : ["Participant"];
      setAllNames(namesRef.current);
      const ws = result.winners ?? (result.winner ? [{ ...result.winner, tokenSlot: 1, totalSlots: 1 }] : []);
      setWinners(ws);
      selectionIdRef.current = `${draw.id}-${ws.map(w => w.id ?? "X").join("-")}-${Date.now().toString(36).toUpperCase()}`;
      phaseRef.current = "animating";
      setPhase("animating");
    }).catch(err => {
      setError(err.message || "Failed to pick winner");
      phaseRef.current = "error";
      setPhase("error");
    });
  }

  // 10-second progress bar
  useEffect(() => {
    if (phase !== "animating") return;
    const startTime = Date.now();
    const DURATION = 10_000;
    const id = setInterval(() => {
      const prog = Math.min(100, ((Date.now() - startTime) / DURATION) * 100);
      progressRef.current = prog;
      setProgress(prog);
      if (prog >= 100) {
        clearInterval(id);
        phaseRef.current = "revealing";
        setPhase("revealing");
        setTimeout(() => { phaseRef.current = "done"; setPhase("done"); }, 1500);
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  // Decelerating name shuffle
  useEffect(() => {
    if (phase !== "animating") return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (phaseRef.current !== "animating") return;
      const n = namesRef.current;
      const name = n[Math.floor(Math.random() * n.length)];
      setDisplayName(name);
      setNameHistory(h => [name, ...h].slice(0, 5));
      const p = progressRef.current;
      const delay = p < 40 ? 60 + p * 1.5 : p < 70 ? 120 + (p - 40) * 6 : p < 90 ? 300 + (p - 70) * 15 : 600 + (p - 90) * 30;
      timer = setTimeout(next, Math.min(delay, 900));
    };
    next();
    return () => clearTimeout(timer);
  }, [phase]);

  // Snap to first winner on reveal
  useEffect(() => {
    if ((phase === "revealing" || phase === "done") && winners.length > 0) {
      setDisplayName(winners[0].name || "Winner");
    }
  }, [phase, winners]);

  const canClose = phase === "done" || phase === "error" || phase === "setup";
  const firstWinner = winners[0] ?? null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={canClose ? onClose : undefined}
      />
      <motion.div
        className="relative bg-[#0c0c18] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center"
              animate={phase === "done" ? { boxShadow: ["0 0 0px rgba(255,215,0,0)", "0 0 20px rgba(255,215,0,0.5)", "0 0 0px rgba(255,215,0,0)"] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-5 h-5 text-[#FFD700]" />
            </motion.div>
            <div>
              <h2 className="text-white font-bold">Pick Winner</h2>
              <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[220px]">{draw.name}</p>
            </div>
          </div>
          {canClose && <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button>}
        </div>

        {/* SETUP */}
        {phase === "setup" && (
          <div className="p-6 space-y-5">
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-zinc-400 text-xs mb-1">{Number(draw.participantCount)} eligible participant{Number(draw.participantCount) !== 1 ? "s" : ""}</p>
              <p className="text-white font-semibold">How many winners?</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setWinnerCount(n)}
                  className={`py-3 rounded-xl border text-base font-black transition-all ${winnerCount === n ? "border-[#FFD700]/60 bg-[#FFD700]/12 text-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.15)]" : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"}`}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs text-center">
              {winnerCount === 1 ? "1 winner will be selected" : `${winnerCount} unique winners will be selected`} · weighted by tokens held
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={startDraw}
                className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Start Draw
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[#FFD700]/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
              </div>
              <motion.div className="absolute inset-0 rounded-full border-2 border-[#FFD700]/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8 }} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">Securing the draw…</p>
              <p className="text-zinc-500 text-sm">Selecting {winnerCount} winner{winnerCount > 1 ? "s" : ""} from {Number(draw.participantCount)} participants</p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="p-6 space-y-4">
            <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-white font-semibold mb-1">Unable to Pick Winner</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm font-semibold transition-colors">Close</button>
          </div>
        )}

        {/* ANIMATING + REVEALING + DONE */}
        {(phase === "animating" || phase === "revealing" || phase === "done") && (
          <div className="p-6 space-y-4">
            {/* Main display reel */}
            <div className={`relative rounded-2xl border-2 transition-all duration-700 overflow-hidden ${
              phase === "done"      ? "border-[#FFD700] bg-[#FFD700]/5 shadow-[0_0_50px_rgba(255,215,0,0.18)]"
              : phase === "revealing" ? "border-[#FFD700]/50 bg-[#FFD700]/3"
              : "border-white/10 bg-white/[0.02]"
            }`}>
              {phase === "done" && (
                <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.07),transparent_70%)]"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
              )}
              <div className="relative z-10 py-8 px-6 flex flex-col items-center min-h-[160px] justify-center">
                {(phase === "animating" || phase === "revealing") && (
                  <>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
                      {phase === "revealing" ? `🏆 Winner${winnerCount > 1 ? "s" : ""} Selected!` : "Selecting from participants…"}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p key={displayName}
                        className={`font-bold text-3xl text-center leading-tight ${phase === "revealing" ? "text-[#FFD700]" : "text-white"}`}
                        initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}
                        transition={{ duration: 0.08 }}>
                        {displayName || "—"}
                      </motion.p>
                    </AnimatePresence>
                  </>
                )}
                {phase === "done" && winners.length > 0 && winnerCount === 1 && firstWinner && (
                  <motion.div className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 18, stiffness: 220 }}>
                    <motion.div
                      className="w-20 h-20 rounded-full bg-[#FFD700]/20 border-2 border-[#FFD700]/60 flex items-center justify-center mb-4"
                      animate={{ boxShadow: ["0 0 20px rgba(255,215,0,0.2)", "0 0 45px rgba(255,215,0,0.5)", "0 0 20px rgba(255,215,0,0.2)"] }}
                      transition={{ repeat: Infinity, duration: 2 }}>
                      <Trophy className="w-10 h-10 text-[#FFD700]" />
                    </motion.div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD700]/80 mb-2">🎉 Winner Selected!</p>
                    <p className="text-3xl font-bold text-white text-center mb-3">{firstWinner.name || "Anonymous"}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {firstWinner.city && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs">{firstWinner.city}</span>}
                      {firstWinner.phone && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono">{firstWinner.phone}</span>}
                      <span className="px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold">
                        {firstWinner.tokensUsed} token{firstWinner.tokensUsed !== 1 ? "s" : ""}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                        Winning Ticket #{firstWinner.tokenSlot} of {firstWinner.totalSlots}
                      </span>
                    </div>
                  </motion.div>
                )}
                {phase === "done" && winners.length > 0 && winnerCount > 1 && (
                  <motion.div className="w-full space-y-3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 18, stiffness: 220 }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD700]/80 text-center mb-3">🎉 {winners.length} Winners Selected!</p>
                    {winners.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center shrink-0 text-xs font-black text-[#FFD700]">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{w.name || "Anonymous"}</p>
                          <p className="text-zinc-500 text-[10px]">{w.phone || ""} {w.city ? `· ${w.city}` : ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#FFD700] text-xs font-bold">{w.tokensUsed} token{w.tokensUsed !== 1 ? "s" : ""}</p>
                          <p className="text-purple-400 text-[10px] font-mono">Ticket #{w.tokenSlot}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Progress bar (animating only) */}
            {phase === "animating" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD700]" />
                    </span>
                    Backend-verified · Tamper-proof
                  </div>
                  <span className="text-[#FFD700] tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-[#FFD700] to-yellow-400 shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-zinc-600 text-[10px]">
                  {allNames.length} eligible participant{allNames.length !== 1 ? "s" : ""} · Selecting {winnerCount} winner{winnerCount > 1 ? "s" : ""} · Weighted by tokens held
                </p>
              </div>
            )}

            {/* Name history trail */}
            {phase === "animating" && nameHistory.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">Recent selections</p>
                {nameHistory.slice(1).map((n, i) => (
                  <div key={`${n}-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5"
                    style={{ opacity: 1 - (i + 1) * 0.22 }}>
                    <div className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                    <span className="text-zinc-500 text-xs font-mono">{n}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Done footer */}
            {phase === "done" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/70 mb-0.5">Status</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <p className="text-emerald-400 text-xs font-bold">Saved to DB</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Selection ID</p>
                    <p className="text-zinc-300 text-[10px] font-mono truncate">{selectionIdRef.current}</p>
                  </div>
                </div>
                <div className="bg-sky-500/8 border border-sky-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <p className="text-sky-400 text-xs">Notifications sent to winner{winners.length > 1 ? "s" : ""} and all participants</p>
                </div>
                <button onClick={() => { onComplete(); onClose(); }}
                  className="w-full py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:opacity-90 transition-opacity">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── PARTICIPANTS MODAL ───────────────────────────────────────────────────────
function ParticipantsModal({ draw, onClose, onTriggered }: { draw: AdminDraw; onClose: () => void; onTriggered: () => void }) {
  const [parts, setParts] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const { toast } = useToast();

  const allSelected = parts.length > 0 && selectedIds.length === parts.length;

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : parts.map((p) => p.id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected participant detail(s) permanently? This cannot be undone.`)) return;
    setDeletingSelected(true);
    try {
      await adminApi.deleteDrawParticipants(draw.id, selectedIds);
      toast({ title: "Participant details deleted", description: `${selectedIds.length} item${selectedIds.length === 1 ? "" : "s"} removed.` });
      setSelectedIds([]);
      onTriggered();
    } catch (error) {
      toast({ title: "Delete failed", description: "Unable to remove selected participant details.", variant: "destructive" });
    } finally {
      setDeletingSelected(false);
    }
  }

  useEffect(() => {
    let alive = true;
    const load = () => {
      adminApi.drawParticipants(draw.id)
        .then((data) => {
          if (!alive) return;
          setParts(Array.isArray(data) ? data : []);
        })
        .catch(console.error)
        .finally(() => { if (alive) setLoading(false); });
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => { alive = false; window.clearInterval(id); };
  }, [draw.id]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => parts.some((p) => p.id === id)));
  }, [parts]);

  async function trigger() {
    setTriggering(true);
    const res = await adminApi.triggerDraw(draw.id).catch(() => null);
    setTriggering(false); setConfirming(false);
    if (res?.winner) { setWinner(res.winner); onTriggered(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#111118] border border-white/8 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold">{draw.name}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">{parts.length} participants · {Number(draw.tokensSold)} tokens sold</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
        </div>

        {winner && (
          <div className="mx-5 mt-4 p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#FFD700] shrink-0" />
            <div>
              <div className="text-[#FFD700] font-bold">🎉 Winner Selected!</div>
              <div className="text-white text-sm">{winner.name} · {winner.city || "—"} · {winner.tokensUsed} token(s)</div>
            </div>
          </div>
        )}

        {draw.status === "closed" && !winner && (
          <div className="mx-5 mt-4">
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFD700] text-black font-bold hover:opacity-90">
                <Zap className="w-5 h-5" />Trigger Draw — Pick Winner Now
              </button>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                <p className="text-white text-sm">This will randomly select a winner from <strong>{parts.length}</strong> entries (weighted by tokens). <strong className="text-red-400">This cannot be undone.</strong></p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-zinc-400 text-sm">Cancel</button>
                  <button onClick={trigger} disabled={triggering} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold text-sm disabled:opacity-50">
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm & Draw"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" /></div> : (
            parts.length === 0 ? <p className="text-zinc-500 text-sm text-center py-8">No participants yet</p> : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 text-zinc-300 text-xs">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        readOnly
                        className="h-4 w-4 rounded border-white/10 bg-[#0a0a0f] text-[#FFD700]"
                      />
                      Select all
                    </button>
                    {selectedIds.length > 0 && (
                      <span>{selectedIds.length} selected</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={selectedIds.length === 0 || deletingSelected}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 disabled:opacity-50"
                  >
                    {deletingSelected ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete selected
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-zinc-500 text-xs font-medium uppercase border-b border-white/8 pb-2">
                    <th className="pb-3 w-12"><span className="sr-only">Select</span></th>
                    <th className="text-left pb-3">User</th>
                    <th className="text-left pb-3">City</th>
                    <th className="text-left pb-3">Tokens</th>
                    <th className="text-left pb-3">Result</th>
                    <th className="text-left pb-3 w-16">Action</th>
                  </tr></thead>
                  <tbody>{parts.map(p => (
                    <tr key={p.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${selectedIds.includes(p.id) ? "bg-white/5" : ""}`}>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 rounded border-white/10 bg-[#0a0a0f] text-[#FFD700]"
                        />
                      </td>
                      <td className="py-2.5"><div className="text-white">{p.userName || "—"}</div><div className="text-zinc-500 text-xs">{p.userPhone}</div></td>
                      <td className="py-2.5 text-zinc-400 text-sm">{p.userCity || "—"}</td>
                      <td className="py-2.5 text-[#FFD700] font-bold">{p.tokensUsed}</td>
                      <td className="py-2.5">
                        {p.result === "won" ? <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Won</span>
                          : p.result === "lost" ? <span className="text-zinc-500">Lost</span>
                            : <span className="text-zinc-600 text-xs">Active</span>}
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Delete participant detail for ${p.userName || "this user"}? This cannot be undone.`)) return;
                            setDeletingSelected(true);
                            try {
                              await adminApi.deleteDrawParticipants(draw.id, [p.id]);
                              toast({ title: "Participant detail deleted", description: `${p.userName || "Entry"} removed.` });
                              setSelectedIds((current) => current.filter((item) => item !== p.id));
                              onTriggered();
                            } catch (error) {
                              toast({ title: "Delete failed", description: "Unable to remove the selected participant.", variant: "destructive" });
                            } finally {
                              setDeletingSelected(false);
                            }
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300 transition-colors hover:bg-white/10"
                          disabled={deletingSelected}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "draft" | "active" | "closed" | "drawn";

export default function AdminDraws() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editDraw, setEditDraw] = useState<AdminDraw | null>(null);
  const [viewDraw, setViewDraw] = useState<AdminDraw | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pickDraw, setPickDraw] = useState<AdminDraw | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.draws().then(setDraws).catch(console.error).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? draws : draws.filter(d => d.status === filter);

  const counts = {
    all: draws.length,
    draft: draws.filter(d => d.status === "draft").length,
    active: draws.filter(d => d.status === "active").length,
    closed: draws.filter(d => d.status === "closed").length,
    drawn: draws.filter(d => d.status === "drawn").length,
  };

  async function del(draw: AdminDraw) {
    const isDraft = draw.status === "draft";
    const msg = isDraft
      ? `Delete "${draw.name}" permanently? This cannot be undone.`
      : `Archive "${draw.name}"? It will be hidden from the site but data is preserved.`;
    if (!confirm(msg)) return;
    setDeleting(draw.id);
    await adminApi.deleteDraw(draw.id).catch(console.error);
    setDeleting(null); load();
  }

  function openCreate() { setEditDraw(null); setPanelOpen(true); }
  function openEdit(d: AdminDraw) { setEditDraw(d); setPanelOpen(true); }

  return (
    <AdminLayout title="Draw Management">
      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Status filter tabs */}
          <div className="flex gap-1 bg-[#111118] border border-white/8 p-1 rounded-xl overflow-x-auto">
            {(["all", "draft", "active", "closed", "drawn"] as StatusFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${filter === f ? "bg-[#FFD700] text-black" : "text-zinc-400 hover:text-white"}`}>
                {f} <span className="opacity-60 ml-1">({counts[f]})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex gap-1 bg-[#111118] border border-white/8 p-1 rounded-xl">
              <button onClick={() => setView("cards")} className={`p-1.5 rounded-lg transition-all ${view === "cards" ? "bg-[#FFD700]/15 text-[#FFD700]" : "text-zinc-500 hover:text-white"}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView("list")} className={`p-1.5 rounded-lg transition-all ${view === "list" ? "bg-[#FFD700]/15 text-[#FFD700]" : "text-zinc-500 hover:text-white"}`}><List className="w-4 h-4" /></button>
            </div>

            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:opacity-90 transition-opacity shrink-0">
              <Plus className="w-4 h-4" />New Draw
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-[#FFD700]" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No {filter !== "all" ? filter : ""} draws yet</h3>
            <p className="text-zinc-500 text-sm mb-6">Create your first draw to get started</p>
            <button onClick={openCreate} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm">
              <Plus className="w-4 h-4" />Create Draw
            </button>
          </div>
        )}

        {/* Card grid view */}
        {!loading && filtered.length > 0 && view === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((d, i) => (
                <motion.div key={d.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: Math.min(i, 5) * 0.05 }}>
                  <DrawCard
                    draw={d}
                    onEdit={() => openEdit(d)}
                    onViewParticipants={() => setViewDraw(d)}
                    onDelete={() => del(d)}
                    onPickWinner={() => setPickDraw(d)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* List view */}
        {!loading && filtered.length > 0 && view === "list" && (
          <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Draw</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Prize Value</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Tokens</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Ends</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {d.imageUrl && <img src={fixImageUrl(d.imageUrl) ?? undefined} alt="" className="w-10 h-10 object-contain rounded-xl bg-white/5 border border-white/8" onError={e => e.currentTarget.style.display = "none"} />}
                          <div>
                            <div className="text-white font-semibold">{d.name}</div>
                            <div className="text-zinc-500 text-xs capitalize">{d.category} · {d.prize}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white hidden md:table-cell">Rs. {Number(d.prizeValuePkr).toLocaleString()}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-white text-xs">{Number(d.tokensSold)}/{d.tokenLimit}</div>
                        <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1">
                          <div className="h-full bg-[#FFD700] rounded-full" style={{ width: `${Math.min(100, (Number(d.tokensSold) / d.tokenLimit) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs hidden lg:table-cell">{d.endsAt ? new Date(d.endsAt).toLocaleDateString("en-GB") : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[d.status]}`}>{d.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setViewDraw(d)} className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white" title="Participants"><Users className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          {(d.status === "active" || d.status === "closed") && (
                            <button onClick={() => setPickDraw(d)}
                              title="Pick Winner"
                              className="p-1.5 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/25 transition-colors">
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {d.status === "drawn" && (
                            <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400" title="Winner selected">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button onClick={() => del(d)} disabled={deleting === d.id}
                            title={d.status === "draft" ? "Delete" : "Archive"}
                            className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Panels */}
      <AnimatePresence>
        {panelOpen && <DrawPanel draw={editDraw} onClose={() => setPanelOpen(false)} onSave={load} />}
      </AnimatePresence>
      {viewDraw && <ParticipantsModal draw={viewDraw} onClose={() => { setViewDraw(null); load(); }} onTriggered={load} />}
      <AnimatePresence>
        {pickDraw && (
          <PickWinnerModal
            draw={pickDraw}
            onClose={() => setPickDraw(null)}
            onComplete={load}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
