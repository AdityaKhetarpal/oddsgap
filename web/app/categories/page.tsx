import type { Metadata } from "next";
import Bars from "@/components/Bars";
import { overview, num, CATEGORY_NAME, signed } from "@/lib/data";

export const metadata: Metadata = {
  title: "By category",
  description: "Price gaps between Kalshi and Polymarket by category: NBA, NFL, MLB and NHL games and Fed rate decisions.",
};

export default function Categories() {
  const rows = overview.results.by_category;
  const cov = Object.fromEntries(overview.coverage.map((c) => [c.category, c]));
  const widest = [...rows].sort((a, b) => b.gap_pp - a.gap_pp)[0];
  const tightest = [...rows].sort((a, b) => a.gap_pp - b.gap_pp)[0];
  return (
    <div className="wrap">
      <div className="head">
        <div className="kicker">By category</div>
        <h1>Where the two markets disagree most</h1>
        <p>
          {CATEGORY_NAME[widest.category]} had the widest typical gap ({widest.gap_pp.toFixed(1)} points) and {CATEGORY_NAME[tightest.category].toLowerCase()} the
          narrowest ({tightest.gap_pp.toFixed(1)} points).
        </p>
      </div>

      <section className="card" data-reveal>
        <h2>Median gap per pair, in points</h2>
        <Bars rows={rows.map((c) => ({ label: CATEGORY_NAME[c.category], value: c.gap_pp }))} unit=" pts" label="Median gap per pair by category" />
        <p className="source">Source: Kalshi and Polymarket public APIs, Jan 2025 to Oct 2026. Each pair counts once.</p>
      </section>

      <section className="section" data-reveal>
        <h2>The numbers</h2>
        <p className="sub">
          &ldquo;Kalshi higher&rdquo; is the median signed difference: above zero means Kalshi priced &ldquo;yes&rdquo; higher than Polymarket.
          Brier score is the accuracy score a day before the close (lower is better).
        </p>
        <div className="table-wrap" style={{ marginTop: 14 }}>
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
