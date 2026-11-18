"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Two price lines for one matched pair: Kalshi (teal) and Polymarket (violet), with the gap between them shaded.
 * x = time, y = price as a probability. Hover or tap to read both prices. With `draw`, the lines draw themselves once.
 */
export default function PairChart({ series, draw = false, height = 300 }: { series: [number, number, number][]; draw?: boolean; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const kRef = useRef<SVGPathElement>(null);
  const pRef = useRef<SVGPathElement>(null);
  const [W, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!draw) return;
    const paths = [kRef.current, pRef.current].filter(Boolean) as SVGPathElement[];
    if (!paths.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    paths.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = `${l}`; p.style.strokeDashoffset = `${l}`; });
    let killed = false;
    import("gsap").then(({ gsap }) => {
      if (killed) return;
      gsap.to(paths, { strokeDashoffset: 0, duration: 2.2, ease: "power1.inOut", stagger: 0.12, onComplete: () => paths.forEach((p) => (p.style.strokeDasharray = "none")) });
    });
    const t = setTimeout(() => paths.forEach((p) => (p.style.strokeDashoffset = "0")), 3500);
    return () => { killed = true; clearTimeout(t); };
  }, [draw, W, series]);

  const narrow = W < 520;
  const PH = narrow ? Math.round(height * 0.85) : height;     // price panel height
  const GH = 64, GAPY = 18;                                    // gap strip height, space above it
  const H = PH;
  const L = narrow ? 38 : 44, R = 10, T = 10, B = 26;
  const n = series.length;
  const t0 = series[0]?.[0] ?? 0, t1 = series[n - 1]?.[0] ?? 1;
  const x = (t: number) => L + ((t - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const all = series.flatMap((s) => [s[1], s[2]]);
  const lo = Math.max(0, Math.floor(Math.min(...all) * 10) / 10), hi = Math.min(1, Math.ceil(Math.max(...all) * 10) / 10);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / Math.max(0.1, hi - lo));
  const line = (i: 1 | 2) => series.map((s, j) => `${j ? "L" : "M"}${x(s[0]).toFixed(1)},${y(s[i]).toFixed(1)}`).join("");
  const band = series.map((s, j) => `${j ? "L" : "M"}${x(s[0]).toFixed(1)},${y(s[1]).toFixed(1)}`).join("") +
    [...series].reverse().map((s) => `L${x(s[0]).toFixed(1)},${y(s[2]).toFixed(1)}`).join("") + "Z";
  const ticks = [lo, (lo + hi) / 2, hi];
  const gaps = series.map((s) => Math.abs(s[1] - s[2]) * 100);
  const gmax = Math.max(2, Math.ceil(Math.max(...gaps)));
  const g0 = PH + GAPY;
  const gy = (v: number) => g0 + GH * (1 - v / gmax);
  const gapArea = series.map((s, j) => `${j ? "L" : "M"}${x(s[0]).toFixed(1)},${gy(gaps[j]).toFixed(1)}`).join("") +
    `L${x(t1).toFixed(1)},${gy(0)}L${x(t0).toFixed(1)},${gy(0)}Z`;
  const TOTAL = g0 + GH + 6;
  const fmtDay = (t: number) => new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const fmtTime = (t: number) => new Date(t * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", timeZone: "UTC" }) + " UTC";
  const days = (t1 - t0) / 86400;
  const xt = [t0, t0 + (t1 - t0) / 2, t1];
  const h = hover != null ? series[hover] : null;

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0, d = Infinity;
    series.forEach((s, i) => { const dd = Math.abs(x(s[0]) - px); if (dd < d) { d = dd; best = i; } });
    setHover(best);
  };

  return (
    <div ref={box} className="chart-box">
      <div className="legend">
        <span><i className="lk" />Kalshi</span>
        <span><i className="lp" />Polymarket</span>
        <span><i className="lg" />Gap between them (also shown below in points)</span>
      </div>
      <svg className="chart" width={W} height={TOTAL} viewBox={`0 0 ${W} ${TOTAL}`} role="img" aria-label="Kalshi and Polymarket prices for the same question over time. Use the left and right arrow keys to step through the readings."
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (e.key === "Home") { e.preventDefault(); setHover(0); }
          else if (e.key === "End") { e.preventDefault(); setHover(series.length - 1); }
          else if (step) { e.preventDefault(); setHover((h) => Math.max(0, Math.min(series.length - 1, (h ?? (step > 0 ? -1 : series.length)) + step))); }
        }}
        onBlur={() => setHover(null)}
        onMouseMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())} onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}>
        <g className="axis">
          {ticks.map((v) => (
            <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text x={L - 6} y={y(v) + 4} textAnchor="end">{Math.round(v * 100)}%</text></g>
          ))}
        </g>
        {xt.map((t, i) => (
          <text key={i} x={x(t)} y={H - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>{days > 3 ? fmtDay(t) : fmtTime(t).replace(" UTC", "")}</text>
        ))}
        <path d={band} fill="var(--gap)" />
        <path ref={kRef} d={line(1)} fill="none" stroke="var(--kalshi)" strokeWidth={2.2} strokeLinejoin="round" />
        <path ref={pRef} d={line(2)} fill="none" stroke="var(--poly)" strokeWidth={2.2} strokeLinejoin="round" />
        <text x={L} y={g0 - 5}>Gap, points</text>
        <line x1={L} x2={W - R} y1={gy(0)} y2={gy(0)} stroke="var(--line)" />
        <text x={L - 6} y={gy(gmax) + 4} textAnchor="end">{gmax}</text>
        <text x={L - 6} y={gy(0) + 4} textAnchor="end">0</text>
        <path d={gapArea} fill="var(--muted)" opacity={0.45} />
        {h && (
          <g>
            <line x1={x(h[0])} x2={x(h[0])} y1={T} y2={g0 + GH} stroke="var(--muted)" strokeDasharray="3 3" />
            <circle cx={x(h[0])} cy={y(h[1])} r={4} fill="var(--kalshi)" />
            <circle cx={x(h[0])} cy={y(h[2])} r={4} fill="var(--poly)" />
          </g>
        )}
      </svg>
      <div className="readout" aria-live="polite">
        {h ? (
          <><b>{fmtTime(h[0])}</b>: <span className="k">Kalshi {(h[1] * 100).toFixed(1)}%</span>, <span className="p">Polymarket {(h[2] * 100).toFixed(1)}%</span>, gap <b>{(Math.abs(h[1] - h[2]) * 100).toFixed(1)} pts</b></>
        ) : "Hover, tap, or focus the chart and use the arrow keys to read both prices at a moment in time."}
      </div>
    </div>
  );
}
