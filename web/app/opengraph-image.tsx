import { ImageResponse } from "next/og";
import { overview, totals } from "@/lib/data";

// The picture shown when a link to the site is shared (1200x630). Numbers come from the same data files as the site.
export const alt = "OddsGap: same event, two prices on Kalshi and Polymarket";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const r = overview.results;
  const t = totals();
  const stats = [
    [`${r.h1.value.toFixed(1)} pts`, "median gap per pair"],
    [r.pairs_tested.toLocaleString("en-US"), "identical questions tested"],
    [`${t.correct}/${t.reviewed}`, "matches correct on hand check"],
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0d11", color: "#ffffff", padding: "70px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" />
            <path d="M6 10 C13 11 18 16 26 16" fill="none" stroke="#3cc8c1" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M6 22 C13 21 18 16 26 16" fill="none" stroke="#a78bfa" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700 }}>OddsGap</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Same event, two prices.</div>
          <div style={{ fontSize: 28, color: "#9aa3b0" }}>How far apart Kalshi and Polymarket price identical questions, and which one was right</div>
        </div>
        <div style={{ display: "flex", gap: 60 }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: "#a78bfa" }}>{v}</div>
              <div style={{ fontSize: 20, color: "#9aa3b0" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
