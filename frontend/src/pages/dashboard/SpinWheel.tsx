import { useState, useEffect, useRef, useCallback } from "react";
import { Coins, Clock, Loader2, RotateCcw, Lock } from "lucide-react";
import { spinApi, type ApiSpinStatus } from "@/lib/api";

const SLICES = [
  { label: "Try Again", tokens: 0, fill: "#0f0f1a", accent: "#1e1e3a", text: "#6b7280" },
  { label: "4 Tokens", tokens: 4, fill: "#FFD700", accent: "#FFE680", text: "#000" },
  { label: "Try Again", tokens: 0, fill: "#0f0f1a", accent: "#1e1e3a", text: "#6b7280" },
  { label: "Try Again", tokens: 0, fill: "#0a0a14", accent: "#161628", text: "#6b7280" },
  { label: "5 Tokens", tokens: 5, fill: "#FFD700", accent: "#FFE680", text: "#000" },
  { label: "Try Again", tokens: 0, fill: "#0f0f1a", accent: "#1e1e3a", text: "#6b7280" },
  { label: "3 Tokens", tokens: 3, fill: "#B8860B", accent: "#FFD700", text: "#000" },
  { label: "Try Again", tokens: 0, fill: "#0a0a14", accent: "#161628", text: "#6b7280" },
];

const TOTAL = SLICES.length;
const SLICE_DEG = 360 / TOTAL;
const CX = 150;
const CY = 150;
const R = 138;
const INNER_R = 38;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function slicePath(i: number): string {
  const start = toRad(i * SLICE_DEG - 90);
  const end = toRad((i + 1) * SLICE_DEG - 90);
  const x1 = CX + R * Math.cos(start);
  const y1 = CY + R * Math.sin(start);
  const x2 = CX + R * Math.cos(end);
  const y2 = CY + R * Math.sin(end);
  const ix1 = CX + INNER_R * Math.cos(start);
  const iy1 = CY + INNER_R * Math.sin(start);
  const ix2 = CX + INNER_R * Math.cos(end);
  const iy2 = CY + INNER_R * Math.sin(end);
  return [
    `M ${ix1} ${iy1}`,
    `L ${x1} ${y1}`,
    `A ${R} ${R} 0 0 1 ${x2} ${y2}`,
    `L ${ix2} ${iy2}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

function textPos(i: number): { x: number; y: number; rotate: number } {
  const angle = (i + 0.5) * SLICE_DEG - 90;
  const r = (R + INNER_R) / 2;
  return {
    x: CX + r * Math.cos(toRad(angle)),
    y: CY + r * Math.sin(toRad(angle)),
    rotate: angle + 90,
  };
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ["#FFD700", "#FFE680", "#fff", "#FFA500", "#4ade80", "#60a5fa"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      r: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 4,
      spin: Math.random() * 360,
      spinSpeed: (Math.random() - 0.5) * 8,
      drift: (Math.random() - 0.5) * 2,
    }));

    let frame = 0;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.spin += p.spinSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(toRad(p.spin));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      });
      frame++;
      if (frame < 120) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
    />
  );
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return "00:00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function SpinWheel({ onTokensUpdated }: { onTokensUpdated?: (newTotal: number) => void }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ApiSpinStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<{ tokensWon: number; show: boolean } | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState("");
  const wheelRef = useRef<SVGGElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await spinApi.status();
      setStatus(s);
      if (!s.canSpin && s.isEligible) setCountdown(s.secondsUntilNextSpin);
    } catch {
      setError("Unable to load spin status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (countdown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          setStatus((prev) => prev ? { ...prev, canSpin: true, nextSpinAt: null, secondsUntilNextSpin: 0 } : prev);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  async function handleSpin() {
    if (spinning || !status?.canSpin || !status?.isEligible) return;
    setError("");
    setSpinning(true);
    setResult(null);

    try {
      const res = await spinApi.spin();

      const currentMod = rotation % 360;
      const targetSliceAngle = (res.resultIndex + 0.5) * SLICE_DEG;
      let additional = targetSliceAngle - currentMod;
      if (additional < 0) additional += 360;
      const totalRotation = rotation + 360 * 5 + additional;

      setRotation(totalRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult({ tokensWon: res.tokensWon, show: true });
        if (res.tokensWon > 0) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
        }
        setStatus((prev) => prev ? { ...prev, canSpin: false, nextSpinAt: res.nextSpinAt, secondsUntilNextSpin: res.secondsUntilNextSpin } : prev);
        setCountdown(res.secondsUntilNextSpin);
        onTokensUpdated?.(res.newTotal);
      }, 4200);
    } catch (err: any) {
      setSpinning(false);
      if (err.message?.includes("already spun")) {
        setStatus((prev) => prev ? { ...prev, canSpin: false } : prev);
      }
      setError(err.message || "Spin failed. Please try again.");
    }
  }

  const isEligible = status?.isEligible ?? false;
  const totalPurchased = status?.totalTokensPurchased ?? 0;
  const isDisabled = loading || spinning || !status?.canSpin || !isEligible;

  // Locked state: not eligible
  if (!loading && !isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-white text-2xl font-bold">Daily Spin Wheel</h2>
          <p className="text-zinc-500 text-sm mt-1">Purchase 100 tokens to unlock the daily spin feature.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 flex flex-col items-center">
            {/* Dimmed wheel */}
            <div className="relative w-full max-w-[340px] mx-auto select-none opacity-30 pointer-events-none">
              <svg viewBox="0 0 300 300" className="w-full h-full" style={{ display: "block" }}>
                <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="#FFD700" strokeWidth="2.5" opacity="0.25" />
                {SLICES.map((s, i) => {
                  const tp = textPos(i);
                  return (
                    <g key={i}>
                      <path d={slicePath(i)} fill={s.fill} stroke="#FFD700" strokeWidth="1.5" opacity="0.95" />
                      <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle"
                        fill={s.tokens > 0 ? "#000" : "#9ca3af"} fontSize={s.tokens >= 3 ? "10" : s.tokens === 2 ? "11" : "10"} fontWeight={s.tokens > 0 ? "800" : "500"}
                        transform={`rotate(${tp.rotate}, ${tp.x}, ${tp.y})`}>
                        {s.tokens > 0 ? (
                          <><tspan x={tp.x} dy="-6">{s.tokens}</tspan><tspan x={tp.x} dy="13" fontSize="8">TOKEN{s.tokens > 1 ? "S" : ""}</tspan></>
                        ) : (
                          <><tspan x={tp.x} dy="-5" fontSize="7.5">BETTER</tspan><tspan x={tp.x} dy="9" fontSize="7.5">LUCK</tspan></>
                        )}
                      </text>
                    </g>
                  );
                })}
                <circle cx={CX} cy={CY} r={INNER_R + 2} fill="#0a0a0f" stroke="#FFD700" strokeWidth="2" />
                <circle cx={CX} cy={CY} r={INNER_R - 2} fill="#111118" stroke="#FFD700" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Lock overlay */}
            <div className="mt-6 text-center space-y-4 w-full max-w-[300px]">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Spin Locked</p>
                <p className="text-zinc-400 text-sm mt-1">Unlock daily spin by purchasing 100 tokens</p>
              </div>

              {/* Progress bar */}
              <div className="bg-[#111118] border border-white/8 rounded-xl p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-xs">Purchase Progress</span>
                  <span className="text-[#FFD700] text-xs font-bold">{totalPurchased} / 100 tokens</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] rounded-full transition-all"
                    style={{ width: `${Math.min(100, totalPurchased)}%` }}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-2">
                  {100 - totalPurchased > 0 ? `${100 - totalPurchased} more tokens needed` : "Eligible!"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full lg:max-w-xs">
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-2">How to Unlock</h3>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">1.</span>Purchase tokens by joining any active draw</li>
                <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">2.</span>Reach a total of 100 purchased tokens</li>
                <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">3.</span>Daily spin unlocks automatically</li>
                <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">4.</span>Spin once per day to win free tokens!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-2xl font-bold">Daily Spin Wheel</h2>
        <p className="text-zinc-500 text-sm mt-1">Spin once per day for a chance to win free tokens!</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] mx-auto select-none">
            <Confetti active={confetti} />

            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: spinning
                  ? "0 0 60px rgba(255,215,0,0.35), 0 0 120px rgba(255,215,0,0.15)"
                  : "0 0 30px rgba(255,215,0,0.15)",
                borderRadius: "50%",
                transition: "box-shadow 0.5s ease",
              }}
            />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 flex flex-col items-center">
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "22px solid #FFD700",
                  filter: "drop-shadow(0 0 6px rgba(255,215,0,0.8))",
                }}
              />
            </div>

            <svg
              viewBox="0 0 300 300"
              className="w-full h-full"
              style={{ display: "block" }}
            >
              <defs>
                <filter id="slice-shadow">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
                </filter>
                <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2a2a3a" />
                  <stop offset="100%" stopColor="#111118" />
                </radialGradient>
              </defs>

              <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="#FFD700" strokeWidth="2.5" opacity="0.25" />
              <circle cx={CX} cy={CY} r={R + 8} fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.1" />

              <g
                ref={wheelRef}
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                }}
              >
                {SLICES.map((s, i) => {
                  const tp = textPos(i);
                  return (
                    <g key={i}>
                      <path
                        d={slicePath(i)}
                        fill={s.fill}
                        stroke="#FFD700"
                        strokeWidth="1.5"
                        opacity="0.95"
                      />
                      {s.tokens > 0 && (
                        <path
                          d={slicePath(i)}
                          fill="url(#none)"
                          stroke={s.accent}
                          strokeWidth="0"
                          opacity="0.3"
                        />
                      )}
                      <text
                        x={tp.x}
                        y={tp.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={s.tokens > 0 ? "#000" : "#9ca3af"}
                        fontSize={s.tokens >= 3 ? "10" : s.tokens === 2 ? "11" : "10"}
                        fontWeight={s.tokens > 0 ? "800" : "500"}
                        transform={`rotate(${tp.rotate}, ${tp.x}, ${tp.y})`}
                        style={{ fontFamily: "system-ui, sans-serif" }}
                      >
                        {s.tokens > 0 ? (
                          <>
                            <tspan x={tp.x} dy="-6">{s.tokens}</tspan>
                            <tspan x={tp.x} dy="13" fontSize="8">TOKEN{s.tokens > 1 ? "S" : ""}</tspan>
                          </>
                        ) : (
                          <>
                            <tspan x={tp.x} dy="-5" fontSize="7.5">BETTER</tspan>
                            <tspan x={tp.x} dy="9" fontSize="7.5">LUCK</tspan>
                          </>
                        )}
                      </text>
                    </g>
                  );
                })}

                <circle cx={CX} cy={CY} r={INNER_R + 2} fill="#0a0a0f" stroke="#FFD700" strokeWidth="2" />
              </g>

              <circle
                cx={CX}
                cy={CY}
                r={INNER_R - 2}
                fill="url(#center-grad)"
                stroke="#FFD700"
                strokeWidth="1.5"
                style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
                onClick={handleSpin}
              />
              <text
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isDisabled ? "#6b7280" : "#FFD700"}
                fontSize="10"
                fontWeight="800"
                letterSpacing="1"
                style={{ cursor: isDisabled ? "not-allowed" : "pointer", userSelect: "none", fontFamily: "system-ui, sans-serif" }}
                onClick={handleSpin}
              >
                {spinning ? "..." : "SPIN"}
              </text>
            </svg>
          </div>

          <button
            onClick={handleSpin}
            disabled={isDisabled}
            className="mt-5 w-full max-w-[240px] h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: isDisabled
                ? "rgba(255,215,0,0.1)"
                : "linear-gradient(to bottom, #FFE680, #FFD700, #B8860B)",
              color: isDisabled ? "#6b7280" : "#000",
              boxShadow: !isDisabled ? "0 0 20px rgba(255,215,0,0.3)" : "none",
            }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Loading…</>
            ) : spinning ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Spinning…</>
            ) : status?.canSpin ? (
              <><RotateCcw className="w-4 h-4" />Spin the Wheel!</>
            ) : (
              <><Clock className="w-4 h-4" />Already Spun Today</>
            )}
          </button>

          {error && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center max-w-[300px]">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 w-full lg:max-w-xs">
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FFD700]" />
              Spin Status
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" />
              </div>
            ) : status?.canSpin ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">Ready to Spin!</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Your daily spin is available</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shrink-0" />
                  <div>
                    <p className="text-[#FFD700] font-semibold text-sm">Spun Today</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Come back tomorrow!</p>
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-zinc-500 text-xs mb-1">Next spin available in</p>
                  <p className="text-white font-mono text-2xl font-bold tracking-widest">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Purchase progress for eligible users */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-xs font-medium">Tokens Purchased</span>
              <span className="text-[#FFD700] text-xs font-bold">{totalPurchased} / 100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B8860B] to-[#FFD700] rounded-full"
                style={{ width: `${Math.min(100, totalPurchased)}%` }}
              />
            </div>
            <p className="text-emerald-400 text-xs mt-1.5">Spin access unlocked ✓</p>
          </div>

          <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-2">How it works</h3>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">1.</span>Click the Spin button once per day</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">2.</span>The wheel spins and lands on a random prize</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">3.</span>Tokens are instantly added to your balance</li>
              <li className="flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">4.</span>Come back every day for another free spin!</li>
            </ul>
          </div>
        </div>
      </div>

      {result?.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setResult(null)}
        >
          <div
            className="relative bg-[#111118] border rounded-3xl p-8 text-center max-w-xs w-full mx-4 shadow-2xl"
            style={{
              borderColor: result.tokensWon > 0 ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.1)",
              boxShadow: result.tokensWon > 0 ? "0 0 60px rgba(255,215,0,0.2)" : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {result.tokensWon > 0 ? (
              <>
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FFE680, #FFD700, #B8860B)", boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}
                >
                  <Coins className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-1">You Won!</h3>
                <p className="text-[#FFD700] text-4xl font-black my-3">
                  +{result.tokensWon} Token{result.tokensWon > 1 ? "s" : ""}
                </p>
                <p className="text-zinc-400 text-sm mb-6">Congratulations! {result.tokensWon} token{result.tokensWon > 1 ? "s have" : " has"} been added to your balance.</p>
                <div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{ boxShadow: "inset 0 0 60px rgba(255,215,0,0.05)" }}
                />
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto mb-5 flex items-center justify-center">
                  <RotateCcw className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-1">Better Luck Next Time</h3>
                <p className="text-zinc-400 text-sm mt-2 mb-2">You received <span className="text-zinc-300 font-semibold">0 tokens</span> this time.</p>
                <p className="text-zinc-500 text-sm mb-6">Come back tomorrow for another chance to win!</p>
              </>
            )}
            <button
              onClick={() => setResult(null)}
              className="w-full h-11 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{
                background: result.tokensWon > 0
                  ? "linear-gradient(to bottom, #FFE680, #FFD700, #B8860B)"
                  : "rgba(255,215,0,0.2)",
                color: result.tokensWon > 0 ? "#000" : "#FFD700",
                border: result.tokensWon === 0 ? "1px solid rgba(255,215,0,0.3)" : "none",
              }}
            >
              {result.tokensWon > 0 ? "Awesome! 🎉" : "Try Again Tomorrow"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
