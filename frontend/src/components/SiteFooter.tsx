import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Facebook, Instagram, Twitter, Youtube, Linkedin,
} from "lucide-react";
import { publicApi, type ApiSocialLink, type ApiFooterContent } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";

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
const PLATFORM_META: Record<string, { label: string; color: string; Icon?: React.FC<{ className?: string }>; svg?: string }> = {
  facebook:  { label: "Facebook",  color: "#1877F2", Icon: Facebook },
  instagram: { label: "Instagram", color: "#E4405F", Icon: Instagram },
  twitter:   { label: "Twitter",   color: "#1DA1F2", Icon: Twitter },
  youtube:   { label: "YouTube",   color: "#FF0000", Icon: Youtube },
  linkedin:  { label: "LinkedIn",  color: "#0077B5", Icon: Linkedin },
  tiktok:    { label: "TikTok",    color: "#ffffff", svg: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.16 8.16 0 004.77 1.52V7.01a4.85 4.85 0 01-1-.32z" },
  telegram:  { label: "Telegram",  color: "#0088cc", svg: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.02c-.12.58-.47.72-.95.45l-2.62-1.93-1.26 1.22c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.41 14.5l-2.55-.8c-.55-.17-.56-.55.12-.82l9.97-3.84c.47-.17.87.1.69.76z" },
  snapchat:  { label: "Snapchat",  color: "#FFFC00", svg: "M12.166 3c-1.165 0-3.875.322-5.176 2.813-.448.857-.341 2.325-.285 3.257l.014.215c-.175.09-.394.134-.614.134-.288 0-.578-.07-.783-.134l-.053-.017a.83.83 0 00-.236-.037c-.47 0-.835.362-.835.81 0 .62.627.915 1.24 1.145.116.044.233.083.348.117.39.115.626.23.755.413.149.213.078.456.01.614-.25.588-.76 1.548-1.666 2.218a.855.855 0 00-.33.672c0 .402.273.745.681.872.504.155 1.067.24 1.672.253.085.464.444.734.892.734.207 0 .438-.057.689-.17.47-.21 1.038-.335 1.643-.335.648 0 1.253.14 1.762.405.204.108.42.163.637.163.448 0 .808-.27.893-.734.605-.013 1.168-.098 1.672-.253.408-.127.681-.47.681-.872 0-.253-.118-.493-.33-.672-.906-.67-1.416-1.63-1.666-2.218-.068-.158-.14-.401.01-.614.13-.183.365-.298.755-.413a6.7 6.7 0 00.348-.117c.613-.23 1.24-.525 1.24-1.145 0-.448-.365-.81-.835-.81a.83.83 0 00-.236.037l-.053.017c-.205.064-.495.134-.783.134-.22 0-.44-.044-.614-.134l.014-.215c.056-.932.163-2.4-.285-3.257C16.041 3.322 13.331 3 12.166 3z" },
};

function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const meta = PLATFORM_META[platform.toLowerCase()];
  if (!meta) return null;
  if (meta.Icon) return <meta.Icon className={className} />;
  if (meta.svg) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={meta.svg} />
    </svg>
  );
  return null;
}

function parseSocialLinks(raw: string | null | undefined): ApiSocialLink[] {
  try { return JSON.parse(raw ?? "[]") ?? []; } catch { return []; }
}

function parseFooter(raw: string | null | undefined): ApiFooterContent {
  try { return { ...DEFAULT_FOOTER, ...JSON.parse(raw ?? "{}") }; } catch { return DEFAULT_FOOTER; }
}

function resolveCopyright(text: string): string {
  return text.replace(/\{year\}/g, String(new Date().getFullYear()));
}

export function SiteFooter() {
  const [footer, setFooter] = useState<ApiFooterContent>(DEFAULT_FOOTER);
  const [socialLinks, setSocialLinks] = useState<ApiSocialLink[]>([]);

  useEffect(() => {
    publicApi.siteStats()
      .then(s => {
        setFooter(parseFooter(s.footerContent));
        setSocialLinks(parseSocialLinks(s.socialLinks));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-black pt-14 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">{footer.tagline}</p>
            <div className="flex flex-col gap-2 text-xs">
              <a
                href={`mailto:${footer.email}`}
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors"
              >
                <span className="inline-flex w-3.5 h-3.5 items-center justify-center text-primary text-sm leading-none">@</span>
                {footer.email}
              </a>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Quick Links</div>
            <ul className="space-y-2.5 text-sm">
              {footer.quickLinks.map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="text-zinc-400 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Follow Us</div>
            {socialLinks.length === 0 ? (
              <p className="text-zinc-600 text-xs">No social links configured yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, i) => {
                  const meta = PLATFORM_META[link.platform.toLowerCase()];
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={meta?.label ?? link.platform}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] hover:bg-white/[0.10] hover:border-white/20 transition-all"
                      style={{ color: meta?.color ?? "#ffffff" }}
                    >
                      <SocialIcon platform={link.platform} className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Payment Methods</div>
            <div className="grid grid-cols-2 gap-2">
              {footer.paymentMethods.map((p, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-zinc-300 text-center hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center text-xs text-zinc-600">
          {resolveCopyright(footer.copyright)}
        </div>
      </div>
    </footer>
  );
}
