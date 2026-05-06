import { useEffect, useState } from "react";
import { Users, Ticket, Trophy, ShieldCheck } from "lucide-react";
import { publicApi, type ApiSiteStats } from "@/lib/api";

function fmtNum(n: number | undefined): string {
  const num = n ?? 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K+`;
  return num.toLocaleString("en-PK") + "+";
}

export function StatsBar() {
  const [siteStats, setSiteStats] = useState<ApiSiteStats | null>(null);

  useEffect(() => {
    publicApi.siteStats().then(setSiteStats).catch(console.error);
  }, []);

  const stats = [
    { icon: Users, value: siteStats ? fmtNum(siteStats.happyUsersCount) : "50,000+", label: "Happy Users" },
    { icon: Ticket, value: siteStats ? fmtNum(siteStats.tokensSoldCount) : "1M+", label: "Tokens Sold" },
    { icon: Trophy, value: siteStats ? fmtNum(siteStats.prizesWonCount) : "1,200+", label: "Prizes Won" },
    { icon: ShieldCheck, value: "100%", label: "Transparent" },
  ];

  return (
    <section className="relative z-20 -mt-8 sm:-mt-12 container mx-auto px-4 md:px-6">
      <div className="bg-[#111118] border border-[#FFD700]/20 rounded-2xl shadow-xl p-6 lg:p-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/10">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-4 lg:p-8">
              <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                <stat.icon className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none">{stat.value}</span>
                <span className="text-sm text-zinc-400 mt-1">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
