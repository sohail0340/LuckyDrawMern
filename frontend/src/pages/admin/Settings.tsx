import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminSettings, type AdminUser } from "@/lib/api";
import { CreditCard, BarChart2, Settings, ShieldCheck, Loader2, Save, Check, Trash2, MessageCircle } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: React.ReactNode }) {
  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-[#FFD700]" />{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-zinc-400 text-xs mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const INP = "w-full bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/40";

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [grantingAdmin, setGrantingAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [settingsResult, adminsResult] = await Promise.allSettled([
        adminApi.settings(),
        adminApi.admins(),
      ]);

      if (!alive) return;

      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
      }

      if (adminsResult.status === "fulfilled") {
        setAdmins(adminsResult.value);
      }

      setLoading(false);
    })().catch(console.error);

    return () => {
      alive = false;
    };
  }, []);

  async function save(section: string, data: Partial<AdminSettings>) {
    setSaving(section);
    setSaveError(null);
    try {
      const updated = await adminApi.updateSettings(data);
      setSettings(updated);
      setSaved(section);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  function set(key: keyof AdminSettings, val: any) {
    setSettings(s => s ? { ...s, [key]: val } : s);
  }

  async function grantAdmin() {
    if (!newAdminEmail) return;
    setGrantingAdmin(true);
    await adminApi.grantAdmin(newAdminEmail).catch(console.error);
    setNewAdminEmail("");
    setGrantingAdmin(false);
    adminApi.admins().then(setAdmins);
  }

  async function revokeAdmin(userId: string | number) {
    if (!confirm("Revoke admin access?")) return;
    await adminApi.revokeAdmin(userId).catch(console.error);
    adminApi.admins().then(setAdmins);
  }

  function SaveBtn({ section, data }: { section: string; data: Partial<AdminSettings> }) {
    const isSaving = saving === section;
    const isSaved = saved === section;
    return (
      <button onClick={() => save(section, data)} disabled={!!saving}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isSaved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#FFD700] text-black"} disabled:opacity-50`}>
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {isSaved ? "Saved!" : isSaving ? "Saving…" : "Save"}
      </button>
    );
  }

  if (loading) return <AdminLayout title="Settings"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div></AdminLayout>;
  if (!settings) return <AdminLayout title="Settings"><div className="text-zinc-500 text-center py-20">Failed to load settings</div></AdminLayout>;

  return (
    <AdminLayout title="Platform Settings">
      <div className="space-y-5 max-w-2xl">
        {saveError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <span className="flex-1">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400/60 hover:text-red-400 shrink-0">✕</button>
          </div>
        )}

        <Section title="Payment Accounts" icon={CreditCard}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="EasyPaisa Account Name">
              <input value={settings.easypaisaTitle || ""} onChange={e => set("easypaisaTitle", e.target.value)} className={INP} />
            </Field>
            <Field label="EasyPaisa Number">
              <input value={settings.easypaisaNumber || ""} onChange={e => set("easypaisaNumber", e.target.value)} className={INP} />
            </Field>
            <Field label="JazzCash Account Name">
              <input value={settings.jazzcashTitle || ""} onChange={e => set("jazzcashTitle", e.target.value)} className={INP} />
            </Field>
            <Field label="JazzCash Number">
              <input value={settings.jazzcashNumber || ""} onChange={e => set("jazzcashNumber", e.target.value)} className={INP} />
            </Field>
            <Field label="Bank Account Title">
              <input value={settings.bankTitle || ""} onChange={e => set("bankTitle", e.target.value)} className={INP} />
            </Field>
            <Field label="Bank IBAN">
              <input value={settings.bankIban || ""} onChange={e => set("bankIban", e.target.value)} className={INP} />
            </Field>
            <Field label="SadaPay Account Name">
              <input value={settings.sadapayTitle || ""} onChange={e => set("sadapayTitle", e.target.value)} className={INP} />
            </Field>
            <Field label="SadaPay Number">
              <input value={settings.sadapayNumber || ""} onChange={e => set("sadapayNumber", e.target.value)} className={INP} placeholder="e.g. 0300 1234567" />
            </Field>
          </div>
          <SaveBtn section="payment" data={{ easypaisaTitle: settings.easypaisaTitle, easypaisaNumber: settings.easypaisaNumber, jazzcashTitle: settings.jazzcashTitle, jazzcashNumber: settings.jazzcashNumber, bankTitle: settings.bankTitle, bankIban: settings.bankIban, sadapayTitle: settings.sadapayTitle, sadapayNumber: settings.sadapayNumber }} />
        </Section>

        <Section title="Homepage Statistics" icon={BarChart2}>
          <p className="text-zinc-500 text-xs">These values control the numbers shown on the homepage stats bar.</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Happy Users Count">
              <input type="number" value={settings.happyUsersCount} onChange={e => set("happyUsersCount", Number(e.target.value))} className={INP} />
            </Field>
            <Field label="Tokens Sold Count">
              <input type="number" value={settings.tokensSoldCount} onChange={e => set("tokensSoldCount", Number(e.target.value))} className={INP} />
            </Field>
            <Field label="Prizes Won Count">
              <input type="number" value={settings.prizesWonCount} onChange={e => set("prizesWonCount", Number(e.target.value))} className={INP} />
            </Field>
          </div>
          <SaveBtn section="stats" data={{ happyUsersCount: settings.happyUsersCount, tokensSoldCount: settings.tokensSoldCount, prizesWonCount: settings.prizesWonCount }} />
        </Section>

        <Section title="General Settings" icon={Settings}>
          <div className="flex items-center gap-3">
            <button onClick={() => set("maintenanceMode", !settings.maintenanceMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-red-500" : "bg-white/10"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-white text-sm">{settings.maintenanceMode ? "🔴 Maintenance Mode ON" : "Maintenance Mode OFF"}</span>
          </div>
          <Field label="Announcement Banner Text">
            <input value={settings.announcementText || ""} onChange={e => set("announcementText", e.target.value)} placeholder="Leave empty to hide banner" className={INP} />
          </Field>
          <SaveBtn section="general" data={{ maintenanceMode: settings.maintenanceMode, announcementText: settings.announcementText }} />
        </Section>

        <Section title="WhatsApp Support" icon={MessageCircle}>
          <p className="text-zinc-500 text-xs leading-relaxed">
            This number will be shown as a floating WhatsApp support button across the website.
          </p>
          <Field label="WhatsApp Number">
            <input
              value={settings.whatsappNumber || ""}
              onChange={e => set("whatsappNumber", e.target.value)}
              className={INP}
              placeholder="e.g. 923001234567"
            />
          </Field>
          <SaveBtn section="whatsapp" data={{ whatsappNumber: settings.whatsappNumber }} />
        </Section>

        <Section title="Admin Accounts" icon={ShieldCheck}>
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFE680] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs">
                  {(a.name || "A").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{a.name || "Admin"}</div>
                  <div className="text-zinc-500 text-xs truncate">{a.email || a.phone || "—"}</div>
                </div>
                {/* Revoke admin button removed — admin deletion disabled in UI */}
              </div>
            ))}
            {admins.length === 0 && <p className="text-zinc-500 text-xs text-center py-3">No admin users</p>}
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/8">
            <input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="user@email.com"
              className={`flex-1 ${INP}`} />
            <button onClick={grantAdmin} disabled={grantingAdmin || !newAdminEmail}
              className="px-4 py-2.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-50 shrink-0">
              {grantingAdmin ? "…" : "Grant Admin"}
            </button>
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
