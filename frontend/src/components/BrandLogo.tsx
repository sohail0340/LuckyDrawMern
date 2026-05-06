import ownersLogo from "@/assets/onwers-logo.jpeg";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 md:gap-3 shrink-0 ${className}`.trim()}>
      <div className={`rounded-full border border-[#FFD700]/70 p-0.5 bg-[#111118] overflow-hidden flex items-center justify-center shadow-[0_0_0_1px_rgba(255,215,0,0.12)] ${compact ? "w-9 h-9 md:w-10 md:h-10" : "w-9 h-9 md:w-12 md:h-12"}`}>
        <img
          src={ownersLogo}
          alt="Kaptan Lucky Draw owners"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-heading font-bold text-white text-base md:text-xl tracking-wide leading-none uppercase">Kaptan</span>
        <span className="font-heading font-semibold text-[#FFD700] text-[9px] md:text-xs tracking-[0.2em] leading-none mt-0.5 uppercase">Lucky Draw</span>
      </div>
    </div>
  );
}