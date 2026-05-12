import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminToken, type AdminUser, type AdminUserDetail, type AdminUserTokensResponse } from "@/lib/api";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  DollarSign,
  Eye,
  Gift,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  Trophy,
  Trash2,
  UserCheck,
  UserX,
  Wallet,
  Zap,
  X,
} from "lucide-react";

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full ${suspended ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}
    >
      {suspended ? "Suspended" : "Active"}
    </span>
  );
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-zinc-400 text-xs">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
        {label}
      </div>
      <span className={`text-xs font-semibold ${valueClass || "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-zinc-400 text-xs">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </div>
      <span className="text-white text-xs font-bold">{value}</span>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  enabled,
  onToggle,
  loading,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  enabled: boolean;
  onToggle: () => void;
  loading: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-zinc-400 text-xs">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </div>
      <button
        onClick={onToggle}
        disabled={loading}
        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-emerald-500" : "bg-white/15"}`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 text-white animate-spin absolute top-1 left-3.5" />
        ) : (
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
          />
        )}
      </button>
    </div>
  );
}

function UserModal({ userId, onClose, onRefresh }: { userId: string; onClose: () => void; onRefresh?: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [togglingReferral, setTogglingReferral] = useState(false);
  const [togglingSpin, setTogglingSpin] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [tokens, setTokens] = useState<AdminToken[] | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [deletingTokens, setDeletingTokens] = useState(false);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    await adminApi.user(userId).then(setDetail).catch(console.error);
  }, [userId]);

  const loadTokens = useCallback(async () => {
    setLoadingTokens(true);
    await adminApi
      .userTokens(userId)
        .then((response: AdminUserTokensResponse) => {
          // Combine both purchased and spin-won tokens
          const allTokens = [
            ...(response.purchasedTokensList ?? []),
            ...(response.spinTokensList ?? []),
          ];
          setTokens(allTokens);
        })
      .catch(console.error)
      .finally(() => setLoadingTokens(false));
  }, [userId]);

  useEffect(() => {
    adminApi
      .user(userId)
      .then((data) => {
        setDetail(data);
        return data;
      })
      .then(loadTokens)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, loadTokens]);

  async function toggleSuspend() {
    if (!detail) return;
    setSuspending(true);
    await adminApi.suspendUser(userId, !detail.user.suspended).catch(console.error);
    setSuspending(false);
    await refresh();
  }

  async function toggleReferral() {
    if (!detail) return;
    setTogglingReferral(true);
    await adminApi
      .setUserFlags(userId, { referralForceEnabled: !detail.user.referralForceEnabled })
      .catch(console.error);
    setTogglingReferral(false);
    await refresh();
  }

  async function toggleSpin() {
    if (!detail) return;
    setTogglingSpin(true);
    await adminApi
      .setUserFlags(userId, { spinForceEnabled: !detail.user.spinForceEnabled })
      .catch(console.error);
    setTogglingSpin(false);
    await refresh();
  }

  async function generateReferral() {
    setGeneratingCode(true);
    await adminApi.generateReferralCode(userId).catch(console.error);
    setGeneratingCode(false);
    await refresh();
  }

  async function deleteUsedTokens() {
    if (!confirm("Delete all used tokens for this user? This cannot be undone.")) return;
    setDeletingTokens(true);
    try {
      const result = await adminApi.deleteUserTokens(userId, { status: "used" });
      toast({
        title: "Used tokens deleted",
        description: `${result.deletedCount} used token${result.deletedCount === 1 ? "" : "s"} removed.`,
      });
      // Immediately refetch everything to ensure consistency
      const [userData, tokensData] = await Promise.all([
        adminApi.user(userId),
        adminApi.userTokens(userId),
      ]);
      setDetail(userData);
        setTokens([
          ...(tokensData.purchasedTokensList ?? []),
          ...(tokensData.spinTokensList ?? []),
        ]);
      onRefresh?.();
    } catch (error) {
      toast({ title: "Delete failed", description: "Unable to delete used tokens.", variant: "destructive" });
    } finally {
      setDeletingTokens(false);
    }
  }

  async function deleteAllTokens() {
    if (!confirm("Permanently delete all tokens for this user? This cannot be undone.")) return;
    setDeletingTokens(true);
    try {
      const result = await adminApi.deleteUserTokens(userId, { status: "all" });
      toast({
        title: "All tokens deleted",
        description: `${result.deletedCount} token${result.deletedCount === 1 ? "" : "s"} permanently removed.`,
      });
      // Immediately refetch everything to ensure consistency
      const [userData, tokensData] = await Promise.all([
        adminApi.user(userId),
        adminApi.userTokens(userId),
      ]);
      setDetail(userData);
        setTokens([
          ...(tokensData.purchasedTokensList ?? []),
          ...(tokensData.spinTokensList ?? []),
        ]);
      onRefresh?.();
    } catch (error) {
      toast({ title: "Delete failed", description: "Unable to delete tokens.", variant: "destructive" });
    } finally {
      setDeletingTokens(false);
    }
  }

  async function deleteToken(tokenId: string, tokenNumber: number) {
    if (!confirm(`Permanently delete token #${tokenNumber}? This cannot be undone.`)) return;
    setDeletingTokenId(tokenId);
    try {
      const result = await adminApi.deleteUserToken(userId, tokenId);
      toast({
        title: "Token deleted",
        description: `${result.deletedCount} token permanently removed from the database.`,
      });
      // Immediately refetch everything to ensure consistency
      const [userData, tokensData] = await Promise.all([
        adminApi.user(userId),
        adminApi.userTokens(userId),
      ]);
      setDetail(userData);
        setTokens([
          ...(tokensData.purchasedTokensList ?? []),
          ...(tokensData.spinTokensList ?? []),
        ]);
      onRefresh?.();
    } catch (error) {
      toast({ title: "Delete failed", description: "Unable to delete this token.", variant: "destructive" });
    } finally {
      setDeletingTokenId(null);
    }
  }

  const user = detail?.user;
  const totalSpent =
    (detail?.transactions as Array<{ status?: string; amountPkr?: number }> | undefined)
      ?.filter((transaction) => transaction.status === "approved")
      .reduce((sum, transaction) => sum + (transaction.amountPkr || 0), 0) ?? 0;
  const totalTokensPurchased =
    (detail?.transactions as Array<{ status?: string; tokensCount?: number }> | undefined)
      ?.filter((transaction) => transaction.status === "approved")
      .reduce((sum, transaction) => sum + (transaction.tokensCount || 0), 0) ?? 0;
  const totalWins =
    (detail?.participations as Array<{ result?: string }> | undefined)?.filter(
      (participation) => participation.result === "won",
    ).length ?? 0;
  const referralEligible = totalTokensPurchased >= 100 || Boolean(user?.referralForceEnabled);
  const spinEligible = totalTokensPurchased >= 100 || Boolean(user?.spinForceEnabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-[#111118] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-white font-bold text-base">User Profile</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-[#FFD700] animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Failed to load user
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-5">
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xl shrink-0 shadow-lg shadow-[#FFD700]/10">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-lg leading-tight truncate">
                      {user.name || "—"}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {user.phone && (
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      )}
                      {user.email && (
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Hash className="w-3 h-3" />ID: {user.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <StatusBadge suspended={user.suspended} />
                    {user.isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FFD700]/15 text-[#FFD700]">
                        <ShieldCheck className="w-3 h-3" />admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-widest mb-3">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Account Details
                  </div>
                  <InfoRow icon={Mail} label="Email" value={user.email ? (user.email.length > 22 ? `${user.email.slice(0, 20)}…` : user.email) : "—"} />
                  <InfoRow icon={Phone} label="Phone" value={user.phone || "—"} />
                  <InfoRow icon={Calendar} label="Joined" value={user.createdAt ? formatDate(user.createdAt) : "—"} />
                  <InfoRow icon={Gift} label="Referral Code" value={user.referralCode || "—"} valueClass="text-[#FFD700] font-mono" />
                  {!user.referralCode && (
                    <button
                      onClick={generateReferral}
                      disabled={generatingCode}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border border-[#FFD700]/30 text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/15 transition-colors disabled:opacity-50"
                    >
                      {generatingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                      Generate Referral Code
                    </button>
                  )}
                  <InfoRow icon={Share2} label="City" value={user.city || "—"} />
                  <InfoRow icon={MapPin} label="Address" value={user.address || "—"} />
                  <InfoRow icon={Hash} label="Transaction ID" value={user.lastPaymentTransactionId || "—"} />
                </div>

                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-widest mb-3">
                    <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                    Platform Stats
                  </div>
                  <StatCard icon={Wallet} label="Total Tokens" value={user.tokens} color="text-[#FFD700]" />
                  <StatCard icon={DollarSign} label="Total Spent" value={`Rs. ${totalSpent.toLocaleString()}`} color="text-emerald-400" />
                  <StatCard icon={Coins} label="Tokens Purchased" value={`${totalTokensPurchased} / 100`} color="text-[#FFD700]" />
                  <StatCard icon={Trophy} label="Total Wins" value={totalWins} color="text-sky-400" />
                  <StatCard icon={Share2} label="Referrals Made" value={user.referralCount} color="text-purple-400" />
                  <StatCard icon={Hash} label="Transactions" value={(detail?.transactions as unknown[] | undefined)?.length ?? 0} color="text-zinc-400" />
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-widest">
                    <Hash className="w-3.5 h-3.5 text-[#FFD700]" />
                    Token History
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={loadTokens}
                      disabled={loadingTokens || deletingTokens}
                      className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg border border-[#FFD700]/20 bg-[#FFD700]/5 px-3 py-2 text-[#FFD700] transition-colors hover:bg-[#FFD700]/10 disabled:opacity-50 cursor-pointer pointer-events-auto z-50"
                    >
                      {loadingTokens ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      {tokens ? "Refresh Tokens" : "View Tokens"}
                    </button>
                    <button
                      type="button"
                      onClick={deleteUsedTokens}
                      disabled={loadingTokens || deletingTokens || !tokens?.length}
                      className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deletingTokens ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete used tokens
                    </button>
                    <button
                      type="button"
                      onClick={deleteAllTokens}
                      disabled={loadingTokens || deletingTokens || !tokens?.length}
                      className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deletingTokens ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete all tokens
                    </button>
                  </div>
                </div>
                {tokens === null ? (
                  <div className="text-zinc-500 text-sm">Click the button to load this user's purchased token IDs.</div>
                ) : !Array.isArray(tokens) || tokens.length === 0 ? (
                  <div className="text-zinc-500 text-sm">No tokens have been assigned to this user yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/10 p-1">
                    <table className="min-w-full text-left text-xs text-zinc-300">
                      <thead className="text-zinc-500 uppercase tracking-[0.2em] text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Token #</th>
                          <th className="px-3 py-2">Draw</th>
                          <th className="px-3 py-2">Purchase</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {tokens.map((token) => (
                          <tr key={token.id} className="border-b border-white/5">
                            <td className="px-3 py-2 font-mono text-white">#{token.tokenNumber}</td>
                            <td className="px-3 py-2 text-zinc-300">{token.drawName || "Available"}</td>
                            <td className="px-3 py-2 text-zinc-300">
                              {token.transactionAmount != null ? `Rs. ${token.transactionAmount.toLocaleString()}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-zinc-300">
                              {token.transactionTokensCount != null ? token.transactionTokensCount : "—"}
                            </td>
                            <td className="px-3 py-2 capitalize text-zinc-300">{token.status}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => deleteToken(token.id, token.tokenNumber)}
                                disabled={deletingTokenId === token.id || deletingTokens}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                              >
                                {deletingTokenId === token.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-widest mb-3">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Feature Access
                </div>
                <div className="space-y-1">
                  <ToggleRow
                    icon={Gift}
                    label={`Referral System — ${referralEligible ? "Active" : "Locked"} (${totalTokensPurchased}/100 tokens)`}
                    enabled={Boolean(user.referralForceEnabled)}
                    onToggle={toggleReferral}
                    loading={togglingReferral}
                    color={referralEligible ? "text-emerald-400" : "text-amber-400"}
                  />
                  <ToggleRow
                    icon={Zap}
                    label={`Daily Spin — ${spinEligible ? "Enabled" : "Locked"} (${totalTokensPurchased}/100 tokens)`}
                    enabled={Boolean(user.spinForceEnabled)}
                    onToggle={toggleSpin}
                    loading={togglingSpin}
                    color={spinEligible ? "text-emerald-400" : "text-amber-400"}
                  />
                </div>
                <p className="text-zinc-600 text-[10px] mt-3">
                  Toggle to manually override eligibility for this user regardless of token purchase count.
                </p>
              </div>

              <button
                onClick={toggleSuspend}
                disabled={suspending}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${user.suspended ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15" : "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"}`}
              >
                {suspending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.suspended ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Unsuspend Account
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Suspend Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .users({ page, limit: 20, q, sort })
      .then((response) => {
        setUsers(response.users);
        setTotal(response.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, q, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.ceil(total / 20);

  return (
    <AdminLayout title="User Management">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone…"
              className="w-full bg-[#111118] border border-white/8 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FFD700]/40"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="bg-[#111118] border border-white/8 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="most_tokens">Most Tokens</option>
            <option value="most_referrals">Most Referrals</option>
          </select>
          <div className="text-zinc-500 text-sm flex items-center">{total} users</div>
        </div>

        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3">Tokens</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-zinc-500">{(page - 1) * 20 + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#FFE680] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
                            {(user.name || "U").charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.name || "—"}</div>
                            {user.isAdmin && (
                              <div className="flex items-center gap-1 text-[10px] text-[#FFD700]">
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">
                        {user.email || user.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">
                        {user.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#FFD700] font-semibold">{user.tokens}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                        {timeAgo(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${user.suspended ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                          {user.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedId(user.id)}
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <span className="text-zinc-500 text-xs">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(pages, current + 1))}
                  disabled={page === pages}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedId !== null && (
          <UserModal
            userId={selectedId}
            onClose={() => {
              setSelectedId(null);
              load();
            }}
            onRefresh={load}
          />
        )}
      </div>
    </AdminLayout>
  );
}