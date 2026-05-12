import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Copy, Share2, CheckCircle2, Coins, Link as LinkIcon, Loader2, Lock } from "lucide-react";
import { userApi, type ApiReferralsResponse } from "@/lib/api";

export default function Referrals() {
  const [data, setData] = useState<ApiReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    userApi.referrals().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div></DashboardLayout>;

  const refCode = data?.referralCode ?? null;
  const refUrl = refCode ? `${window.location.origin}/auth?tab=signup&ref=${refCode}` : "";
  const eligible = data?.referralEnabled ?? data?.isEligible ?? false;
  const totalPurchased = data?.totalTokensPurchased ?? 0;

  function copy(value: string, type: "code" | "link") {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleShare(url: string) {
    if (!url) return;
    setShareUrl(url);
    setShowShareMenu(true);
  }

  function shareToWhatsApp() {
    const message = encodeURIComponent(`🎉 Join Kaptan Lucky Draw!\n\n${shareUrl}\n\nUse my referral code and earn rewards! 🎁`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
    setShowShareMenu(false);
  }

  function shareToFacebook() {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
    setShowShareMenu(false);
  }

  function shareToTwitter() {
    const text = encodeURIComponent(`🎉 Join Kaptan Lucky Draw! Use my referral link to earn rewards! 🎁 ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
    setShowShareMenu(false);
  }

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
    setShowShareMenu(false);
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Referral Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">{eligible ? "Share your code and earn 1 token when someone uses it and makes their first approved purchase." : "Buy 100 tokens to unlock referral system"}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Referrals", value: data?.totalReferrals ?? 0, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
            { label: "Tokens Earned", value: data?.earnedTokens ?? 0, icon: Coins, color: "text-[#FFD700]", bg: "bg-[#FFD700]/10" },
            { label: "Pending Rewards", value: Math.max(0, (data?.totalReferrals ?? 0) - (data?.earnedTokens ?? 0)), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-white/8 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#111118] border border-[#FFD700]/20 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">Your Referral Code</h2>
          <div className="text-zinc-400 text-xs">You have purchased {totalPurchased} / 100 tokens</div>
          {!eligible && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Lock className="w-4 h-4" />
              To get your referral link, you have to buy at least 100 tokens.
            </div>
          )}
          {eligible && refCode ? (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px] bg-[#0a0a0f] border border-[#FFD700]/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-[#FFD700] font-bold font-mono text-lg tracking-widest">{refCode}</span>
                  <button onClick={() => copy(refCode, "code")} className="flex items-center gap-1.5 text-zinc-400 hover:text-[#FFD700] transition-colors text-xs font-medium">
                    {copied === "code" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied === "code" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button onClick={() => copy(refUrl, "link")} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                  <LinkIcon className="w-4 h-4 text-zinc-400" />
                  {copied === "link" ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => handleShare(refUrl)}
                  type="button"
                  aria-label="Share referral link"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black text-sm font-bold hover:opacity-90 active:opacity-75 transition-opacity cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  {copied === "link" ? "Shared!" : "Share"}
                </button>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed border-t border-white/5 pt-3">
                You earn <span className="text-[#FFD700] font-semibold">1 token</span> when the referred user makes their first approved token purchase. The new user gets nothing.
              </p>
            </>
          ) : null}
        </div>

        {refUrl && (
          <div className="bg-[#0a0a0f] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-zinc-500 text-xs truncate">{refUrl}</span>
          </div>
        )}

        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Referral Activity</h2>
            <span className="text-zinc-500 text-xs">{data?.totalReferrals ?? 0} referrals</span>
          </div>
          {!data?.referrals.length ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-white text-sm font-medium">No referrals yet</p>
              <p className="text-zinc-500 text-xs mt-1">Invite friends to earn 1 token on their first approved purchase</p>
            </div>
          ) : (
            data.referrals.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{r.name}</p>
                  <p className="text-zinc-500 text-xs">Joined {r.joined}</p>
                </div>
                {r.rewardGiven && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />+1 token
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowShareMenu(false)}
        >
          <div
            className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-4">Share Your Referral Link</h3>
            <p className="text-zinc-400 text-xs mb-6">Choose how you want to share:</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={shareToWhatsApp}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-600/10 border border-green-600/30 hover:bg-green-600/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">📱</div>
                <span className="text-white text-xs font-semibold">WhatsApp</span>
              </button>

              <button
                onClick={shareToFacebook}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">f</div>
                <span className="text-white text-xs font-semibold">Facebook</span>
              </button>

              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">𝕏</div>
                <span className="text-white text-xs font-semibold">Twitter</span>
              </button>

              <button
                onClick={copyShareLink}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-600/10 border border-purple-600/30 hover:bg-purple-600/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform">📋</div>
                <span className="text-white text-xs font-semibold">Copy Link</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full py-2 px-4 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
