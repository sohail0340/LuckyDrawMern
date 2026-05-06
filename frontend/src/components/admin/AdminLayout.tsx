import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Trophy, CreditCard, Medal,
  Share2, Settings, LogOut, Menu, X, ChevronRight, HardDrive, Headphones, Layout,
} from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { BrandLogo } from "@/components/BrandLogo";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/draws", label: "Draws", icon: Trophy },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/winners", label: "Winners", icon: Medal },
  { href: "/admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/support", label: "Support Tickets", icon: Headphones },
  { href: "/admin/footer", label: "Footer Editor", icon: Layout },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  function handleLogout() { logout(); navigate("/auth"); }

  return (
    <div className="flex flex-col h-full bg-[#0d0d15] border-r border-white/8 w-60 shrink-0">
      <div className="p-5 border-b border-white/8">
        <Link href="/" className="block">
          <BrandLogo compact />
        </Link>
        <div className="mt-2">
          <div className="text-white font-bold text-sm leading-none">Kaptan Admin</div>
          <div className="text-[#FFD700] text-[10px] tracking-widest leading-none mt-0.5 uppercase">Control Panel</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href !== "/admin" && location.startsWith(href));
          return (
            <Link key={href} href={href} onClick={onClose}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group relative ${active ? "bg-[#FFD700]/10 text-[#FFD700]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FFD700] rounded-r-full" />}
                <Icon className={`w-4 h-4 ${active ? "text-[#FFD700]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                <span className="text-sm font-medium">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs">
            {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name || "Admin"}</div>
            <div className="text-zinc-500 text-[10px] truncate">{user?.email || user?.phone || ""}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-medium py-1.5 px-2 rounded-lg hover:bg-red-500/10 transition-colors">
          <LogOut className="w-3.5 h-3.5" />Logout
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
              <Sidebar onClose={() => setSidebarOpen(false)} />
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-[-40px] w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-white/8 flex items-center gap-4 px-4 md:px-6 bg-[#0a0a0f] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-none truncate">{title}</h1>
            <p className="text-zinc-500 text-[10px] mt-0.5">Kaptan Admin Panel</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-white text-xs font-semibold">{user?.name || "Admin"}</div>
              <div className="text-[#FFD700] text-[10px]">Super Admin</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="p-4 md:p-6 max-w-[1600px] mx-auto w-full">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
