import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Coins, CreditCard, Trophy,
  Users, Bell, UserCircle, LogOut, Menu, X, ChevronRight, Loader2, Shield
} from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { BrandLogo } from "@/components/BrandLogo";

const NAV = [
  { href: "/dashboard",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/tokens",        label: "My Tokens",     icon: Coins },
  { href: "/dashboard/transactions",  label: "Transactions",  icon: CreditCard },
  { href: "/dashboard/draws",         label: "My Draws",      icon: Trophy },
  { href: "/dashboard/referrals",     label: "Referrals",     icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile",       label: "Profile",       icon: UserCircle },
];

function NavItem({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const [location] = useLocation();
  const active = href === "/dashboard" ? location === "/dashboard" : location.startsWith(href);

  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 opacity-50" />}
    </Link>
  );
}

function UserPill({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const initials = (user?.name || user?.email || user?.phone || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const displayName = user?.name || user?.email || user?.phone || "User";
  const displaySub = user?.email || user?.phone || "";

  if (compact) {
    return (
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <div className="mx-3 mt-4 mb-2 flex items-center gap-3 bg-[#111118] border border-white/8 rounded-xl px-3 py-2.5">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
        {initials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-white text-xs font-semibold truncate">{displayName}</span>
        {displaySub && <span className="text-zinc-500 text-[10px] truncate">{displaySub}</span>}
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, loading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/8 bg-[#0d0d15] fixed top-0 left-0 bottom-0 z-40">
        <Link href="/" className="px-5 h-16 border-b border-white/8 flex items-center">
          <BrandLogo compact />
        </Link>
        <UserPill />
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => <NavItem key={n.href} {...n} />)}
          {user.isAdmin && (
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10 hover:bg-[#FFD700]/15 transition-all"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="flex-1">Admin Panel</span>
            </Link>
          )}
        </nav>
        <div className="px-3 pb-4">
          <button onClick={() => { logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0d0d15] border-b border-white/8 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-white p-1"><Menu className="w-5 h-5" /></button>
        <Link href="/" className="flex items-center">
          <BrandLogo compact className="gap-2" />
        </Link>
        <span className="font-bold text-white text-sm uppercase tracking-wide ml-1">Dashboard</span>
        <div className="ml-auto">
          <Link href="/dashboard/notifications" className="text-zinc-400 p-1 block">
            <Bell className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#0d0d15] border-r border-white/8 flex flex-col">
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/8">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                <BrandLogo compact className="gap-2" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <UserPill />
            <nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto">
              {NAV.map((n) => <NavItem key={n.href} {...n} onClick={() => setMobileOpen(false)} />)}
              {user.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10 hover:bg-[#FFD700]/15 transition-all"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Admin Panel</span>
                </Link>
              )}
            </nav>
            <div className="px-3 pb-4">
              <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 transition-all">
                <LogOut className="w-4 h-4" /><span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 lg:pl-60 pt-14 lg:pt-0">
        <div className="min-h-screen p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
