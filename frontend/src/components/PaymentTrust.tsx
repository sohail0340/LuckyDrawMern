import { Landmark, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const PAYMENTS = [
  {
    id: "easypaisa",
    render: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-[#00A950]/20 border border-[#00A950]/30 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#00A950]" />
        </div>
        <span className="font-extrabold text-base tracking-tight">
          <span className="text-[#00A950]">easy</span>
          <span className="text-white">paisa</span>
        </span>
      </div>
    ),
  },
  {
    id: "jazzcash",
    render: () => (
      <div className="flex items-center gap-1.5">
        <div className="bg-[#ED1C24] text-white font-black px-2 py-0.5 rounded-full text-xs italic tracking-tight shadow-[0_0_10px_rgba(237,28,36,0.4)]">
          Jazz
        </div>
        <span className="text-white font-black text-base italic tracking-tight">Cash</span>
      </div>
    ),
  },
  {
    id: "sadapay",
    render: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-[#FF6B2B]/15 border border-[#FF6B2B]/30 flex items-center justify-center">
          <div className="w-3 h-3 bg-[#FF6B2B] rounded-sm rotate-45" />
        </div>
        <span className="font-extrabold text-base tracking-tight text-white">
          Sada<span className="text-[#FF6B2B]">Pay</span>
        </span>
      </div>
    ),
  },
  {
    id: "bank",
    render: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-700/40 border border-zinc-600/40 flex items-center justify-center">
          <Landmark className="w-3.5 h-3.5 text-zinc-300" />
        </div>
        <span className="font-bold text-sm text-zinc-300 tracking-wide">Bank Transfer</span>
      </div>
    ),
  },
];

export function PaymentTrust() {
  return (
    <section className="container mx-auto px-4 md:px-6 mt-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d18] via-[#111120] to-[#0d0d18]" />
        <div className="absolute inset-0 border border-white/8 rounded-2xl" />

        {/* Subtle top glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 px-5 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Left: Trust label */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">Trusted by thousands</div>
              <div className="text-zinc-500 text-[11px] leading-tight">across Pakistan</div>
            </div>
          </div>

          {/* Divider (desktop) */}
          <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

          {/* Right: Payment methods */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
            {PAYMENTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.07 }}
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
              >
                {p.render()}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
