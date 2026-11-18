import type { Metadata } from "next";
import { overview, totals, num, CATEGORY_NAME } from "@/lib/data";

export const metadata: Metadata = {
  title: "How we tested it",
  description: "The pre-registered test behind OddsGap: how questions were matched across Kalshi and Polymarket, how prices were lined up, the three hypotheses and their verdicts, and the limits.",
};

const GH = "https://github.com/AdityaKhetarpal/oddsgap";

export default function Method() {
  const r = overview.results;
  const t = totals();
  const aliases = Object.entries(overview.aliases);
  return (
    <div className="wrap">
      <div className="head">
        <div className="kicker">Locked on {r.pre_registered}, before any market data was downloaded</div>
        <h1>How we tested it</h1>
        <p>
          The questions, the definitions and the rule for each verdict were written down before we saw any data.
          Every step can be rerun from the <a href={GH}>notebooks on GitHub</a>.
        </p>
      </div>
      <div className="prose">
        <h2>1. Matching identical questions</h2>
        <ul>
          <li><b>Games (NBA, NFL, MLB, NHL):</b> same league, same date, same two teams. The pair asks &ldquo;does team X win?&rdquo;, using the team Polymarket lists first.</li>
          <li><b>Fed decisions:</b> same meeting and the same outcome, defined the same way (&ldquo;no change&rdquo;, &ldquo;cut 25 bps&rdquo;, &ldquo;cut more than 25&rdquo; …).
            Polymarket&apos;s older &ldquo;25+ bps increase&rdquo; also counts larger hikes, which Kalshi lists separately, so it isn&apos;t paired.</li>
          <li><b>Team codes</b> mostly agree. Where they don&apos;t, the difference was found in the data (the same game, same day, one code different, at least 3 times):{" "}
            {aliases.map(([k, v]) => `${k.split(":")[1].toUpperCase()} = ${v}`).join(", ")}.</li>
          <li><b>Dropped by rule:</b> doubleheader games (the two platforms can&apos;t be lined up reliably) and pairs whose two markets closed more than 24 hours apart (rescheduled games).</li>
          <li><b>Checked by hand:</b> 25 random pairs per category, {t.correct} of {t.reviewed} correct (same question, same &ldquo;yes&rdquo; side).</li>
        </ul>
        <div className="table-wrap" style={{ margin: "8px 0 18px" }}>
          <table>
            <thead><tr><th>Category</th><th className="num">Matched</th><th className="num">Liquid</th><th className="num">Prices downloaded</th><th className="num">Tested</th><th className="num">Settled differently</th></tr></thead>
            <tbody>
              {overview.coverage.map((c) => (
                <tr key={c.category}><td>{CATEGORY_NAME[c.category]}</td><td className="num">{num(c.matched)}</td><td className="num">{num(c.liquid)}</td><td className="num">{num(c.sampled)}</td><td className="num">{num(c.tested)}</td><td className="num">{c.settled_differently}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">
          Liquid = at least 1,000 traded on each side (Kalshi contracts, Polymarket dollars). Prices were downloaded for every liquid Fed pair and a random 600
          liquid games per league (seed 42), drawn before any price was seen.
        </p>

        <h2>2. Lining up the prices</h2>
        <ul>
          <li>Both histories sit on one 3-hour grid (UTC). <b>Kalshi:</b> the last hourly candle in each step, using the bid-ask midpoint when both sides were quoted, otherwise the last trade.
            <b> Polymarket:</b> its public 3-hour price series.</li>
          <li><b>Comparable point:</b> both prices exist, both are between 3% and 97%, and the time is at least 3 hours before the earlier close.</li>
          <li><b>Pair gap:</b> the median of |Kalshi − Polymarket| over a pair&apos;s comparable points, in percentage points. A pair needs at least 4 points.</li>
        </ul>

        <h2>3. The three locked tests</h2>
        <ul>
          <li><b>H1, the gap is at least 2 points:</b> {r.h1.verdict}. Median {r.h1.value.toFixed(2)} pts, 90% range {r.h1.low.toFixed(2)} to {r.h1.high.toFixed(2)}, {num(r.h1.n)} pairs.</li>
          <li><b>H2, gaps narrow in the last 24 hours compared with 3+ days out:</b> {r.h2.verdict}. {r.h2.far_median.toFixed(2)} → {r.h2.near_median.toFixed(2)} pts;
            change {r.h2.value.toFixed(2)}, 90% range {r.h2.low.toFixed(2)} to {r.h2.high.toFixed(2)}, {num(r.h2.n)} pairs.</li>
          <li><b>H3, equal accuracy a day before the close (Brier score):</b> {r.h3.verdict}. Kalshi {r.h3.brier_kalshi.toFixed(4)}, Polymarket {r.h3.brier_polymarket.toFixed(4)};
            difference {r.h3.value.toFixed(4)}, 90% range {r.h3.low.toFixed(4)} to {r.h3.high.toFixed(4)}, {num(r.h3.n)} pairs.</li>
        </ul>
        <p className="small">Ranges come from resampling the pairs 10,000 times (seed 42) and keeping the middle 90%.</p>

        <h2>4. Pairs that settled differently</h2>
        {r.mismatches.length === 0 ? <p>None among the matched pairs.</p> : (
          <>
            <p>
              {r.mismatches.length} pairs settled one way on Kalshi and the other way on Polymarket. Their dates and close times point to rescheduled or relabelled
              games rather than a real dispute, but we list them rather than drop them. They are left out of the accuracy test.
            </p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Kalshi market</th><th>Polymarket event</th><th className="num">Kalshi</th><th className="num">Polymarket</th></tr></thead>
                <tbody>
                  {r.mismatches.map((m) => (
                    <tr key={m.kalshi_ticker}><td>{m.date}</td><td><code>{m.kalshi_ticker}</code></td><td><code>{m.poly_slug}</code></td>
                      <td className="num bad">{m.kalshi_result ? "yes" : "no"}</td><td className="num bad">{m.poly_result ? "yes" : "no"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h2>5. Changes after locking</h2>
        <p>
          All were made before any price was downloaded, and are recorded in the <a href={`${GH}/blob/main/knowledge/_meta/log.md`}>change log</a>:
          rule-based matching instead of a text-similarity model (every pair here follows a fixed rule), the 600-games-per-league sample, and the
          doubleheader and 24-hour rules found while checking matches.
        </p>

        <h2>Limits</h2>
        <ul>
          <li><b>3-hour steps.</b> Fast moves inside a step are invisible, so &ldquo;who moves first&rdquo; is a rough reading.</li>
          <li><b>Time stamps, checked.</b> We treat Polymarket&apos;s 3-hour timestamps as the time of the price. Shifting its series one or two steps either way only widened the average gap
            (best fit: {r.alignment.best_shift === 0 ? "no shift" : `${r.alignment.best_shift} steps`}; {r.alignment.table.map((s) => `${s.shift_steps > 0 ? "+" : ""}${s.shift_steps}: ${s.mean_gap_pp.toFixed(2)}`).join(", ")} pts), so the two series line up as assumed.</li>
          <li><b>Price steps.</b> Both platforms quote in half-cent or cent steps, so medians land on round values (0.5, 0.75, 1.0). The average gap per pair (median {r.detail.mean_gap_per_pair_median.toFixed(2)} pts) is reported alongside.</li>
          <li><b>Two different crowds.</b> Kalshi is a US-regulated exchange (US users, dollar accounts); Polymarket runs on crypto rails. Fees and the cost of moving money
            between them are reasons small gaps can last. We don&apos;t measure them.</li>
          <li><b>Mostly sports.</b> Games dominate the sample; only {r.by_category.find((c) => c.category === "Fed")?.pairs ?? 0} Fed outcomes were tested.</li>
          <li>Descriptive research only. Not trading advice; real-money prediction trading isn&apos;t allowed everywhere, including India.</li>
        </ul>
      </div>
    </div>
  );
}
