import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { publicApi, type ApiSiteStats } from "@/lib/api";

const DEFAULT_WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "923001234567";

function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return `92${digits.slice(1)}`;
  return digits;
}

function buildWhatsAppUrl(raw: string | null | undefined): string | null {
  const number = normalizeWhatsAppNumber(raw);
  if (!number) return null;
  const message = encodeURIComponent("Hello, I need help with Kaptan Lucky Draw.");
  return `https://wa.me/${number}?text=${message}`;
}

export function WhatsAppSupportButton() {
  const [siteStats, setSiteStats] = useState<ApiSiteStats | null>(null);

  useEffect(() => {
    publicApi.siteStats().then(setSiteStats).catch(() => {});
  }, []);

  const href =
    buildWhatsAppUrl(siteStats?.whatsappNumber) ??
    buildWhatsAppUrl(DEFAULT_WHATSAPP_NUMBER);
  if (!href) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact support on WhatsApp"
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 z-[70] flex h-12 w-12 sm:h-14 sm:w-14 md:h-14 md:w-14 items-center justify-center rounded-full border border-white/10 bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition-all duration-300 hover:shadow-[0_22px_48px_rgba(37,211,102,0.44)]"
    >
      <motion.span
        aria-hidden="true"
        animate={{ scale: [1, 1.28, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border border-white/35"
      />
      <span className="relative flex h-9 w-9 sm:h-10 sm:w-10 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/15 ring-1 ring-white/15">
        <svg viewBox="0 0 32 32" className="h-5 w-5 sm:h-5 sm:w-5 md:h-5 md:w-5 fill-current text-white" aria-hidden="true">
          <path d="M19.11 17.21c-.27-.14-1.59-.78-1.83-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.15.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.35-.8-.71-1.34-1.58-1.5-1.85-.16-.27-.02-.42.12-.56.13-.13.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.6-1.46-.82-2-.22-.53-.45-.46-.6-.47h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.95 2.57 1.08 2.75.13.18 1.86 2.84 4.5 3.98.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.59-.65 1.81-1.28.22-.63.22-1.17.15-1.28-.07-.11-.25-.18-.52-.31z" />
          <path d="M16.03 3C8.84 3 3 8.83 3 16.01c0 2.54.73 5.02 2.11 7.15L3 29l5.99-2.08a13.01 13.01 0 007.04 2.06h.01C23.22 28.98 29 23.15 29 15.97 29 8.8 23.21 3 16.03 3zm0 23.61h-.01a10.6 10.6 0 01-5.4-1.48l-.39-.23-3.56 1.24 1.16-3.68-.25-.38a10.58 10.58 0 01-1.63-5.67c0-5.85 4.76-10.61 10.61-10.61 2.83 0 5.5 1.1 7.5 3.11a10.54 10.54 0 013.11 7.5c0 5.85-4.76 10.61-10.62 10.61z" />
        </svg>
      </span>
    </motion.a>
  );
}