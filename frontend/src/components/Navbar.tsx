import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/useAuth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/draws", label: "Live Draws" },
    { href: "/winners", label: "Winners" },
    { href: "/refer", label: "Refer & Earn" },
    { href: "/contact", label: "Contact Us" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="/">
            <BrandLogo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative font-medium text-sm transition-colors ${
                  isActive(l.href) ? "text-white" : "text-zinc-300 hover:text-[#FFD700]"
                }`}
              >
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#FFD700] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-full px-5 font-bold text-sm h-9 border-none shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-5 font-semibold text-sm h-9">
                    Login
                  </Button>
                </Link>
                <Link href="/auth?tab=signup">
                  <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-full px-5 font-bold text-sm h-9 border-none shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0a0a0f]">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center h-11 px-4 rounded-xl font-medium text-sm transition-colors ${
                    isActive(l.href)
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                {user ? (
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-xl w-full font-bold h-11 border-none flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl w-full font-semibold h-11">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth?tab=signup" onClick={() => setIsOpen(false)}>
                      <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-xl w-full font-bold h-11 border-none">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
