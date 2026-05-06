import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminSettings, type ApiFooterContent, type ApiSocialLink } from "@/lib/api";
import {
  Layout, Loader2, Save, Check, Plus, Trash2,
  GripVertical, ArrowUp, ArrowDown, Mail,
  Link as LinkIcon, CreditCard, Copyright, Pencil, Share2,
  Facebook, Instagram, Twitter, Youtube, Linkedin,
} from "lucide-react";

const DEFAULT_FOOTER: ApiFooterContent = {
  brandName: "Kaptan Draw",
  tagline: "Pakistan's most trusted token-based lucky draw platform. Win cars, bikes, and cash with verified, transparent draws.",
  email: "support@captainluckydraw.com",
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "Active Draws", href: "/draws" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Winners", href: "/winners" },
    { label: "Contact", href: "/contact" },
  ],
  paymentMethods: ["Easypaisa", "JazzCash", "Sadapay", "Bank Transfer"],
  copyright: `© ${new Date().getFullYear()} Kaptan Lucky Draw. All rights reserved.`,
};

function parseFooter(raw: string | null | undefined): ApiFooterContent {
  try { return { ...DEFAULT_FOOTER, ...JSON.parse(raw ?? "{}") }; } catch { return DEFAULT_FOOTER; }
}

function parseSocialLinks(raw: string | null | undefined): ApiSocialLink[] {
  try { return JSON.parse(raw ?? "[]") ?? []; } catch { return []; }
}

const INP = "w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/40 placeholder:text-zinc-600";

const SOCIAL_PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "telegram", label: "Telegram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "snapchat", label: "Snapchat" },
];

const PLATFORM_ICON: Record<string, React.FC<{ className?: string }>> = {
  facebook: Facebook, instagram: Instagram, twitter: Twitter,
  youtube: Youtube, linkedin: Linkedin,
};

function SocialPlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICON[platform.toLowerCase()];
  if (Icon) return <Icon className={className} />;
  return <Share2 className={className} />;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#FFD700]" />{title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-zinc-400 text-xs mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
        saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#FFD700] text-black hover:bg-yellow-400"
      }`}
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

export default function AdminFooterEditor() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [footer, setFooter] = useState<ApiFooterContent>(DEFAULT_FOOTER);
  const [socialLinks, setSocialLinks] = useState<ApiSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [newLinkPlatform, setNewLinkPlatform] = useState("facebook");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    adminApi.settings()
      .then(s => {
        setSettings(s);
        setFooter(parseFooter(s.footerContent));
        setSocialLinks(parseSocialLinks(s.socialLinks));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof ApiFooterContent>(key: K, val: ApiFooterContent[K]) {
    setFooter(f => ({ ...f, [key]: val }));
  }

  function updateSocialLinks(next: ApiSocialLink[]) {
    setSocialLinks(next);
    if (settings) setSettings({ ...settings, socialLinks: JSON.stringify(next) });
  }

  async function saveSection(section: string) {
    setSaving(section);
    setSaveError(null);
    try {
      const updated = await adminApi.updateSettings({
        footerContent: JSON.stringify(footer),
        socialLinks: JSON.stringify(socialLinks),
      });
      setSettings(updated);
      setFooter(parseFooter(updated.footerContent));
      setSocialLinks(parseSocialLinks(updated.socialLinks));
      setSaved(section);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save.");
    } finally {
      setSaving(null);
    }
  }

  function addLink() {
    if (!newLinkLabel.trim() || !newLinkHref.trim()) return;
    set("quickLinks", [...footer.quickLinks, { label: newLinkLabel.trim(), href: newLinkHref.trim() }]);
    setNewLinkLabel(""); setNewLinkHref("");
  }

  function removeLink(i: number) {
    set("quickLinks", footer.quickLinks.filter((_, idx) => idx !== i));
  }

  function moveLink(from: number, to: number) {
    const links = [...footer.quickLinks];
    const [item] = links.splice(from, 1);
    links.splice(to, 0, item);
    set("quickLinks", links);
  }

  function addPayment() {
    if (!newPayment.trim()) return;
    set("paymentMethods", [...footer.paymentMethods, newPayment.trim()]);
    setNewPayment("");
  }

  function removePayment(i: number) {
    set("paymentMethods", footer.paymentMethods.filter((_, idx) => idx !== i));
  }

  function movePayment(from: number, to: number) {
    const arr = [...footer.paymentMethods];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    set("paymentMethods", arr);
  }

  function addSocialLink() {
    if (!newLinkUrl.trim()) return;
    updateSocialLinks([...socialLinks, { platform: newLinkPlatform, url: newLinkUrl.trim() }]);
    setNewLinkUrl("");
  }

  function removeSocialLink(index: number) {
    updateSocialLinks(socialLinks.filter((_, i) => i !== index));
  }

  function moveSocialLink(from: number, to: number) {
    const links = [...socialLinks];
    const [item] = links.splice(from, 1);
    links.splice(to, 0, item);
    updateSocialLinks(links);
  }

  if (loading) return (
    <AdminLayout title="Footer Editor">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Footer Editor">
      <div className="max-w-2xl space-y-5">

        {/* Preview note */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl text-[#FFD700] text-xs">
          <Layout className="w-4 h-4 shrink-0" />
          Changes apply to the footer on every page of the website instantly after saving.
        </div>

        {saveError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <span className="flex-1">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {/* ── Brand & Contact ── */}
        <Section title="Brand & Contact" icon={Pencil}>
          <Field label="Brand Name">
            <input className={INP} value={footer.brandName} onChange={e => set("brandName", e.target.value)} placeholder="Kaptan Draw" />
          </Field>
          <Field label="Tagline / Description">
            <textarea className={`${INP} resize-none h-20`} value={footer.tagline}
              onChange={e => set("tagline", e.target.value)}
              placeholder="Pakistan's most trusted token-based lucky draw platform…" />
          </Field>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Support Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input className={`${INP} pl-8`} value={footer.email} onChange={e => set("email", e.target.value)} placeholder="support@example.com" />
              </div>
            </Field>
          </div>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => saveSection("brand")} saving={saving === "brand"} saved={saved === "brand"} />
          </div>
        </Section>

        {/* ── Quick Links ── */}
        <Section title="Quick Links" icon={LinkIcon}>
          <div className="space-y-2">
            {footer.quickLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0a0a0f] border border-white/8 rounded-xl px-3 py-2">
                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{link.label}</div>
                  <div className="text-zinc-500 text-xs truncate">{link.href}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveLink(i, i - 1)} disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                  ><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => moveLink(i, i + 1)} disabled={i === footer.quickLinks.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                  ><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => removeLink(i)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Add New Link</div>
            <div className="grid grid-cols-2 gap-2">
              <input className={INP} placeholder="Label (e.g. About Us)" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} />
              <input className={INP} placeholder="Path (e.g. /about)" value={newLinkHref} onChange={e => setNewLinkHref(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addLink()} />
            </div>
            <button onClick={addLink} disabled={!newLinkLabel.trim() || !newLinkHref.trim()}
              className="flex items-center gap-2 text-sm text-[#FFD700] hover:text-yellow-400 disabled:opacity-40 transition-colors font-medium">
              <Plus className="w-4 h-4" /> Add Link
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => saveSection("links")} saving={saving === "links"} saved={saved === "links"} />
          </div>
        </Section>

        {/* ── Payment Methods ── */}
        <Section title="Payment Methods" icon={CreditCard}>
          <div className="space-y-2">
            {footer.paymentMethods.map((pm, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0a0a0f] border border-white/8 rounded-xl px-3 py-2.5">
                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="flex-1 text-white text-sm font-medium">{pm}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => movePayment(i, i - 1)} disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors">
                    <ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => movePayment(i, i + 1)} disabled={i === footer.paymentMethods.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors">
                    <ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removePayment(i)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Add Payment Method</div>
            <div className="flex gap-2">
              <input className={`${INP} flex-1`} placeholder="e.g. Meeza, NayaPay…" value={newPayment}
                onChange={e => setNewPayment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPayment()} />
              <button onClick={addPayment} disabled={!newPayment.trim()}
                className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 disabled:opacity-40 transition-colors font-medium">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => saveSection("payment")} saving={saving === "payment"} saved={saved === "payment"} />
          </div>
        </Section>

        {/* ── Copyright ── */}
        <Section title="Copyright Text" icon={Copyright}>
          <Field label="Footer Copyright Line">
            <input className={INP} value={footer.copyright} onChange={e => set("copyright", e.target.value)}
              placeholder="© 2026 Kaptan Lucky Draw. All rights reserved." />
          </Field>
          <p className="text-zinc-600 text-xs">Tip: You can use {'{year}'} to insert the current year dynamically.</p>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => saveSection("copyright")} saving={saving === "copyright"} saved={saved === "copyright"} />
          </div>
        </Section>

        {/* ── Social Media Links ── */}
        <Section title="Social Media Links" icon={Share2}>
          <p className="text-zinc-500 text-xs">Add, remove, and reorder the social icons shown in the site footer.</p>
          <div className="space-y-2">
            {socialLinks.length === 0 && (
              <p className="text-zinc-600 text-xs text-center py-3">No social links added yet.</p>
            )}
            {socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[#FFD700]">
                  <SocialPlatformIcon platform={link.platform} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold capitalize">{link.platform}</div>
                  <div className="text-zinc-500 text-xs truncate">{link.url}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveSocialLink(i, i - 1)} disabled={i === 0}
                    className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20 transition-colors text-xs">↑</button>
                  <button onClick={() => moveSocialLink(i, i + 1)} disabled={i === socialLinks.length - 1}
                    className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20 transition-colors text-xs">↓</button>
                  <button onClick={() => removeSocialLink(i)}
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <select value={newLinkPlatform} onChange={e => setNewLinkPlatform(e.target.value)}
              className="bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/40 shrink-0">
              {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://..." className={`flex-1 ${INP}`}
              onKeyDown={e => e.key === "Enter" && addSocialLink()} />
            <button onClick={addSocialLink} disabled={!newLinkUrl.trim()}
              className="px-3 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/12 disabled:opacity-40 transition-colors shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={() => saveSection("social")} saving={saving === "social"} saved={saved === "social"} />
          </div>
        </Section>

      </div>
    </AdminLayout>
  );
}
