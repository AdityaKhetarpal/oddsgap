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
    [`${r.h1.value.toFixed(2)} pts`, "median gap per pair"],
    [r.pairs_tested.toLocaleString("en-US"), "identical questions tested"],
    [`${t.correct}/${t.reviewed}`, "matches correct on hand check"],
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0f1014", color: "#ffffff", padding: "70px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="66" height="44" viewBox="0 0 30 20">
            <circle cx="10" cy="10" r="9.5" fill="#ea5a2f" />
            <circle cx="20" cy="10" r="9.5" fill="#4f72ff" />
            <path d="M15 1.922 A9.5 9.5 0 0 1 15 18.078 A9.5 9.5 0 0 1 15 1.922 Z" fill="#ffffff" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700 }}>OddsGap</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Same event, two prices.</div>
          <div style={{ fontSize: 28, color: "#9ba1ac" }}>How far apart Kalshi and Polymarket price identical questions, and which one was right</div>
        </div>
        <div style={{ display: "flex", gap: 60 }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: "#ffffff" }}>{v}</div>
              <div style={{ fontSize: 20, color: "#9ba1ac" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
