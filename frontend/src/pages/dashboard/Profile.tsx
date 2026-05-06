import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserCircle, Phone, MapPin, Edit3, Save, X, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/useAuth";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState({
    name: user?.name ?? "",
    city: user?.city ?? "",
    address: user?.address ?? "",
    province: user?.province ?? "",
    cnic: user?.cnic ?? "",
  });

  async function save() {
    setSaving(true);
    setError("");
    try {
      await userApi.updateProfile(draft);
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft({
      name: user?.name ?? "",
      city: user?.city ?? "",
      address: user?.address ?? "",
      province: user?.province ?? "",
      cnic: user?.cnic ?? "",
    });
    setEditing(false);
    setError("");
  }

  const inputClass = "bg-[#0a0a0f] border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-[#FFD700]/40 focus:outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed";

  function Field({ label, field, type = "text" }: { label: string; field: keyof typeof draft; type?: string }) {
    return (
      <div className="space-y-1.5">
        <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{label}</label>
        <input
          type={type}
          disabled={!editing}
          value={draft[field]}
          onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
          className={inputClass}
        />
      </div>
    );
  }

  const displayName = user?.name || user?.email || user?.phone || "User";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Profile</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your personal information.</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FFD700]/30 text-[#FFD700] text-sm font-semibold hover:bg-[#FFD700]/10 transition-colors">
              <Edit3 className="w-4 h-4" />Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white transition-colors">
                <X className="w-4 h-4" />Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black text-sm font-bold hover:opacity-90 transition-opacity">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        <div className="bg-[#111118] border border-white/8 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{displayName}</p>
            <p className="text-zinc-500 text-sm">{user?.email || user?.phone || ""}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">Verified Account</span>
              </div>
              {user?.referralCode && (
                <div className="text-zinc-600 text-xs">Referral: <span className="text-[#FFD700] font-mono font-semibold">{user.referralCode}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle className="w-4 h-4 text-[#FFD700]" />
            <h2 className="text-white font-semibold text-sm">Personal Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name" field="name" />
            <Field label="CNIC" field="cnic" />
          </div>
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-[#FFD700]" />
            <h2 className="text-white font-semibold text-sm">Contact Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Email</label>
              <input type="email" disabled value={user?.email ?? "—"} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Phone</label>
              <input type="tel" disabled value={user?.phone ?? "—"} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            <h2 className="text-white font-semibold text-sm">Address</h2>
          </div>
          <Field label="Street Address" field="address" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="City" field="city" />
            <Field label="Province" field="province" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
