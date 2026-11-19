import type { Metadata } from "next";
import Bars from "@/components/Bars";
import { overview, num, CATEGORY_NAME, signed } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/categories" },
  title: "By category",
  description: "Price gaps between Kalshi and Polymarket by category: NBA, NFL, MLB and NHL games and Fed rate decisions.",
};

export default function Categories() {
  const rows = overview.results.by_category;
  const cov = Object.fromEntries(overview.coverage.map((c) => [c.category, c]));
  const most = [...rows].sort((a, b) => b.share_over_2pp - a.share_over_2pp)[0];
  const games = rows.filter((c) => c.category !== most.category).map((c) => c.share_over_2pp);
  return (
    <div className="wrap">
      <div className="head">
        <h1>Where the two markets disagree most</h1>
        <p>
          {CATEGORY_NAME[most.category]}: {most.share_over_2pp.toFixed(0)}% of pairs differed by 2 points or more, against{" "}
          {Math.min(...games).toFixed(0)}–{Math.max(...games).toFixed(0)}% in the other categories. Typical gaps everywhere are about a point or less.
        </p>
      </div>

      <section className="card">
        <h3>Share of pairs that differed by 2 points or more</h3>
        <Bars rows={rows.map((c) => ({ label: CATEGORY_NAME[c.category], value: c.share_over_2pp }))} unit="%" highlight={CATEGORY_NAME[most.category]} label="Share of pairs with a median gap of 2 points or more, by category" />
        <p className="source">Source: Kalshi and Polymarket public APIs, Jan 2025 to Oct 2026. Each pair counts once.</p>
      </section>

      <section className="section" style={{ paddingTop: 56 }}>
        <h2>The numbers</h2>
        <p className="sub">
          &ldquo;Kalshi higher&rdquo; is the median signed difference: above zero means Kalshi priced &ldquo;yes&rdquo; higher than Polymarket.
          Brier score is the accuracy score a day before the close (lower is better).
        </p>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Data table" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Category</th><th className="num">Matched</th><th className="num">Tested</th><th className="num">Median gap</th><th className="num">90% range</th>
                <th className="num">Pairs ≥ 2 pts</th><th className="num">Kalshi higher</th><th className="num">Brier: Kalshi</th><th className="num">Brier: Polymarket</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.category}>
                  <td>{CATEGORY_NAME[c.category]}</td>
                  <td className="num">{num(cov[c.category]?.matched ?? 0)}</td>
                  <td className="num">{num(c.pairs)}</td>
                  <td className="num"><b>{c.gap_pp.toFixed(2)}</b></td>
                  <td className="num">{c.low.toFixed(2)}–{c.high.toFixed(2)}</td>
                  <td className="num">{c.share_over_2pp.toFixed(0)}%</td>
                  <td className="num">{signed(c.kalshi_higher_pp)}</td>
                  <td className="num"><span className="k">{c.brier_kalshi?.toFixed(4) ?? "–"}</span></td>
                  <td className="num"><span className="p">{c.brier_polymarket?.toFixed(4) ?? "–"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="source">
          &ldquo;Tested&rdquo; = pairs with prices downloaded (all liquid Fed pairs; a random 600 liquid games per league) and at least 4 comparable points.
          Polymarket&apos;s NFL listings only go back to the 2026 season, so NFL has fewer pairs. Table scrolls sideways on small screens.
        </p>
      </section>
    </div>
  );
}
