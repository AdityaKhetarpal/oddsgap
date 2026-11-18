import Link from "next/link";
import Vanta from "@/components/Vanta";
import PairChart from "@/components/PairChart";
import Bars from "@/components/Bars";
import { overview, curve, totals, num, pp, dateName, CATEGORY_NAME } from "@/lib/data";

const LD = {"@context": "https://schema.org", "@type": "Dataset", "name": "OddsGap: Kalshi vs Polymarket prices on identical questions", "description": "7,556 yes/no questions listed on both Kalshi and Polymarket (NBA, NFL, MLB and NHL games, Fed rate decisions), with both prices every 3 hours and a pre-registered test of the gap between them, January 2025 to October 2026.", "url": "https://odds-gap.vercel.app", "temporalCoverage": "2025-01/2026-10", "keywords": ["prediction markets", "Kalshi", "Polymarket", "market microstructure", "calibration"], "isBasedOn": ["https://kalshi.com", "https://polymarket.com"], "sameAs": "https://github.com/AdityaKhetarpal/oddsgap", "creator": {"@type": "Person", "name": "Aditya Khetarpal", "url": "https://www.linkedin.com/in/adityakhetarpal"}};

export default function Home() {
  const r = overview.results;
  const t = totals();
  const hero = overview.hero;
  const gap = r.h1.value;
  const over2 = overview.histogram.filter((b) => b.from >= 2).reduce((s, b) => s + b.pairs, 0);
  const over2pct = (100 * over2) / r.pairs_tested;
  const brierK = r.h3.brier_kalshi, brierP = r.h3.brier_polymarket;
  const lead = r.lead;
  // a leader only if one direction shows a real (|r| > 0.05) and clearly larger link
  const leader = Math.max(Math.abs(lead.kalshi_then_poly), Math.abs(lead.poly_then_kalshi)) < 0.05 ? null : lead.kalshi_then_poly > lead.poly_then_kalshi ? "Kalshi" : "Polymarket";
  const d = r.detail;
  const g = (v: number) => (v < 1 ? v.toFixed(2) : v.toFixed(1));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <section className="hero">
        <Vanta />
        <div className="wrap hero-head">
          <h1 className="display">Same question, {gap < 2 ? "nearly the same" : "different"} odds: a typical gap of {g(gap)} points.</h1>
        </div>
        <div className="wrap hero-grid">
          <div>
            <p className="lead">
              We matched {num(t.matched)} yes/no questions listed on both Kalshi and Polymarket (NBA, NFL, MLB and NHL games, and Fed rate decisions,
              January 2025 to October 2026) and compared the two prices every 3 hours, {num(r.points)} times. A gap of {g(gap)} points is, for
              example, {(50 + gap / 2).toFixed(2)}% on one and {(50 - gap / 2).toFixed(2)}% on the other. A quarter of the time the prices were identical,
              and only {over2pct.toFixed(0)}% of pairs differed by 2 points or more.
            </p>
            <div className="actions">
              <Link className="btn" href="/pairs">Explore the pairs</Link>
              <Link className="btn ghost" href="/method">How we tested it</Link>
            </div>
          </div>
          <div className="card hero-pair">
            <h2 className="pair-title">One real pair: {CATEGORY_NAME[hero.category]}, {dateName(hero.date)}</h2>
            <div className="qpair">
              <div className="qk">{hero.kalshi_question}</div>
              <div className="qp">{hero.poly_question}</div>
            </div>
            <PairChart series={hero.series} draw height={260} />
            <p className="source">Chosen by a fixed rule: the much-traded pair whose gap ({g(hero.gap_pp)} pts) is closest to the overall median. The lines overlap where the prices were equal.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section">
          <h2>Does the gap close as the end gets near?</h2>
          <p className="sub">
            Average gap between the two prices, by time left before the market closed. The last 3 hours are left out, because prices there
            jump to 0% or 100%. (The locked test uses medians; averages show the same shape more finely, because prices move in half-cent steps.)
          </p>
          <div className="card" style={{ marginTop: 16 }}>
            <Bars rows={curve.map((c) => ({ label: c.time_left, value: c.mean_gap_pp }))} unit=" pts" label="Average gap in points by time left before the close" />
            <p className="source">Every comparable 3-hour point across {num(r.pairs_tested)} tested pairs. Source: Kalshi and Polymarket public APIs, Jan 2025 to Oct 2026.</p>
          </div>
        </section>

        <section className="section">
          <h2>Five questions, three of them decided in advance</h2>
          <p className="sub">All three tests were written down and locked before any market data was downloaded, so the answers couldn&apos;t be bent to fit. The last two are reported for context and decide nothing. The matching itself was checked by hand: {t.correct} of {t.reviewed} sampled pairs were the same question.</p>
          <div className="answers">
            <article className="answer">
              <p className="status locked">Locked test</p>
              <h3 className="q">Do the two platforms disagree by 2 points or more?</h3>
              <div>
                <p className="a">{r.h1.verdict === "supported" ? "Yes." : r.h1.verdict === "rejected" ? "No: the gap is smaller." : "Too close to call."}</p>
              <p className="small">The median pair gap is {pp(gap, 2)}, with a 90% range of {r.h1.low.toFixed(2)} to {r.h1.high.toFixed(2)} over {num(r.h1.n)} pairs. Only {over2pct.toFixed(0)}% of pairs differed by 2 points or more, and the two prices were identical at {d.identical_share.toFixed(0)}% of moments.</p>
              </div>
            </article>
            <article className="answer">
              <p className="status locked">Locked test</p>
              <h3 className="q">Is the gap smaller in the last 24 hours than 3+ days out?</h3>
              <div>
                <p className="a">{r.h2.verdict === "supported" ? "Yes, it narrows." : "No clear narrowing."}</p>
              <p className="small">
                Over {num(r.h2.n)} pairs open that long: {pp(r.h2.far_median, 2)} more than 3 days out, {pp(r.h2.near_median, 2)} in the last day.
                Change {r.h2.value.toFixed(2)} (90% range {r.h2.low.toFixed(2)} to {r.h2.high.toFixed(2)}).
              </p>
              </div>
            </article>
            <article className="answer">
              <p className="status locked">Locked test</p>
              <h3 className="q">Was one platform more accurate a day before the close?</h3>
              <div>
                <p className="a">{r.h3.verdict === "supported" ? "No: equally accurate." : `Yes: ${r.h3.better === "kalshi" ? "Kalshi" : "Polymarket"}.`}</p>
              <p className="small">
                Brier score (lower is better), {num(r.h3.n)} pairs: <span className="k">Kalshi {brierK.toFixed(4)}</span>, <span className="p">Polymarket {brierP.toFixed(4)}</span>.
                Difference {r.h3.value.toFixed(4)} (90% range {r.h3.low.toFixed(4)} to {r.h3.high.toFixed(4)}).
              </p>
              </div>
            </article>
            <article className="answer">
              <p className="status">Reported, not tested</p>
              <h3 className="q">Who moves first?</h3>
              <div>
                <p className="a">{leader ? `${leader}, slightly.` : "Neither, at 3-hour steps."}</p>
              <p className="small">
                Both prices move together within the same 3-hour step (correlation {lead.same_step.toFixed(2)}). One platform&apos;s move predicting the
                other&apos;s next move: Kalshi then Polymarket {lead.kalshi_then_poly.toFixed(3)}, Polymarket then Kalshi {lead.poly_then_kalshi.toFixed(3)},
                over {num(lead.steps)} steps. Finer timing would need minute-level data.
              </p>
              </div>
            </article>
            <article className="answer">
              <p className="status">Reported, not tested</p>
              <h3 className="q">Did they ever settle the same question differently?</h3>
              <div>
                <p className="a">{t.different === 0 ? "Never." : `${t.different} of ${num(t.matched)} pairs.`}</p>
              <p className="small">
                {t.different === 0 ? "Every matched pair settled the same way on both platforms." :
                  "Each one involved a rescheduled or relabelled game, judging by the dates and close times. They're listed on the method page, not hidden."}
              </p>
              </div>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="callout">
            <p>
              <b>What this means:</b> the two biggest prediction markets price the same question {r.h1.verdict === "rejected" ? "very closely" : "close, but not identically"}.
              Fees, different users (US accounts on Kalshi, crypto wallets on Polymarket) and the cost of moving money between them are reasons small gaps
              can last; we don&apos;t measure those here. This describes the past. It isn&apos;t a trading signal.
            </p>
            <p style={{ margin: 0 }}><Link href="/categories">See the gaps by category</Link></p>
          </div>
        </section>
      </div>
    </>
  );
}
