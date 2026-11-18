import Link from "next/link";
import Vanta from "@/components/Vanta";
import PairChart from "@/components/PairChart";
import Bars from "@/components/Bars";
import { overview, curve, totals, num, pp, dateName, CATEGORY_NAME } from "@/lib/data";

export default function Home() {
  const r = overview.results;
  const t = totals();
  const hero = overview.hero;
  const gap = r.h1.value;
  const over2 = overview.histogram.filter((b) => b.from >= 2).reduce((s, b) => s + b.pairs, 0);
  const over2pct = (100 * over2) / r.pairs_tested;
  const brierK = r.h3.brier_kalshi, brierP = r.h3.brier_polymarket;
  const lead = r.lead;
  const leader = Math.abs(lead.kalshi_then_poly - lead.poly_then_kalshi) < 0.02 ? null : lead.kalshi_then_poly > lead.poly_then_kalshi ? "Kalshi" : "Polymarket";

  return (
    <>
      <section className="hero">
        <Vanta />
        <div className="wrap hero-grid">
          <div>
            <div className="kicker">Kalshi vs Polymarket · {num(r.pairs_tested)} identical questions, priced every 3 hours</div>
            <h1 className="display">Same question, {gap < 2 ? "nearly the same" : "different"} odds: a typical gap of {gap.toFixed(1)} points.</h1>
            <p className="lead">
              We matched {num(t.matched)} yes/no questions that both platforms listed (NBA, NFL, MLB and NHL games, and Fed rate decisions,
              January 2025 to October 2026) and compared the two prices every 3 hours. A gap of {gap.toFixed(1)} percentage points means, for
              example, {(50 + gap / 2).toFixed(1)}% on one and {(50 - gap / 2).toFixed(1)}% on the other.
            </p>
            <div className="stats">
              <div className="stat"><b>{pp(gap)}</b><span>median gap per pair (90% range {r.h1.low.toFixed(1)}–{r.h1.high.toFixed(1)})</span></div>
              <div className="stat"><b>{over2pct.toFixed(0)}%</b><span>of pairs differed by 2 points or more</span></div>
              <div className="stat"><b>{num(r.points)}</b><span>moments where both prices were compared</span></div>
              <div className="stat"><b>{t.correct} of {t.reviewed}</b><span>matches correct when checked by hand</span></div>
            </div>
            <div className="actions">
              <Link className="btn" href="/pairs">Explore the pairs</Link>
              <Link className="btn ghost" href="/method">How we tested it</Link>
            </div>
          </div>
          <div className="card">
            <h3>One real pair: {CATEGORY_NAME[hero.category]}, {dateName(hero.date)}</h3>
            <div className="qpair">
              <div className="qk">{hero.kalshi_question}</div>
              <div className="qp">{hero.poly_question}</div>
            </div>
            <PairChart series={hero.series} draw height={260} />
            <p className="source">Chosen by a fixed rule: the much-traded pair whose gap ({pp(hero.gap_pp)}) is closest to the overall median.</p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section" data-reveal>
          <h2>Does the gap close as the end gets near?</h2>
          <p className="sub">
            Median gap between the two prices, by time left before the market closed. The last 3 hours are left out, because prices there
            jump to 0% or 100%.
          </p>
          <div className="card" style={{ marginTop: 16 }}>
            <Bars rows={curve.map((c) => ({ label: c.time_left, value: c.median_gap_pp }))} unit=" pts" label="Median gap in points by time left before the close" />
            <p className="source">Points, all {num(r.pairs_tested)} tested pairs. Source: Kalshi and Polymarket public APIs, Jan 2025 to Oct 2026.</p>
          </div>
        </section>

        <section className="section" data-reveal>
          <h2>Three answers</h2>
          <p className="sub">All three tests were written down and locked before any market data was downloaded, so the answers couldn&apos;t be bent to fit.</p>
          <div className="grid g3" style={{ marginTop: 18 }}>
            <article className="card verdict">
              <span className="tag">Locked test 1</span>
              <div className="q">Do the two platforms disagree by 2 points or more?</div>
              <div className="a">{r.h1.verdict === "supported" ? "Yes." : r.h1.verdict === "rejected" ? "No: the gap is smaller." : "Too close to call."}</div>
              <p className="small">The median pair gap is {pp(gap, 2)}, with a 90% range of {r.h1.low.toFixed(2)} to {r.h1.high.toFixed(2)} over {num(r.h1.n)} pairs.</p>
            </article>
            <article className="card verdict">
              <span className="tag">Locked test 2</span>
              <div className="q">Is the gap smaller in the last 24 hours than 3+ days out?</div>
              <div className="a">{r.h2.verdict === "supported" ? "Yes, it narrows." : "No clear narrowing."}</div>
              <p className="small">
                Over {num(r.h2.n)} pairs open that long: {pp(r.h2.far_median, 2)} more than 3 days out, {pp(r.h2.near_median, 2)} in the last day.
                Change {r.h2.value.toFixed(2)} (90% range {r.h2.low.toFixed(2)} to {r.h2.high.toFixed(2)}).
              </p>
            </article>
            <article className="card verdict">
              <span className="tag">Locked test 3</span>
              <div className="q">Was one platform more accurate a day before the close?</div>
              <div className="a">{r.h3.verdict === "supported" ? "No: equally accurate." : `Yes: ${r.h3.better === "kalshi" ? "Kalshi" : "Polymarket"}.`}</div>
              <p className="small">
                Brier score (lower is better), {num(r.h3.n)} pairs: <span className="k">Kalshi {brierK.toFixed(4)}</span>, <span className="p">Polymarket {brierP.toFixed(4)}</span>.
                Difference {r.h3.value.toFixed(4)} (90% range {r.h3.low.toFixed(4)} to {r.h3.high.toFixed(4)}).
              </p>
            </article>
          </div>
        </section>

        <section className="section" data-reveal>
          <div className="grid g2">
            <article className="card verdict extra">
              <span className="tag">Reported, not tested</span>
              <div className="q">Who moves first?</div>
              <div className="a">{leader ? `${leader}, slightly.` : "Neither, at 3-hour steps."}</div>
              <p className="small">
                Both prices move together within the same 3-hour step (correlation {lead.same_step.toFixed(2)}). One platform&apos;s move predicting the
                other&apos;s next move: Kalshi→Polymarket {lead.kalshi_then_poly.toFixed(3)}, Polymarket→Kalshi {lead.poly_then_kalshi.toFixed(3)},
                over {num(lead.steps)} steps. Finer timing would need minute-level data.
              </p>
            </article>
            <article className="card verdict extra">
              <span className="tag">Reported, not tested</span>
              <div className="q">Did they ever settle the same question differently?</div>
              <div className="a">{t.different === 0 ? "Never." : `${t.different} of ${num(t.matched)} pairs.`}</div>
              <p className="small">
                {t.different === 0 ? "Every matched pair settled the same way on both platforms." :
                  "Each one involved a rescheduled or relabelled game, judging by the dates and close times. They're listed on the method page, not hidden."}
              </p>
            </article>
          </div>
        </section>

        <section className="section" data-reveal>
          <div className="callout">
            <p style={{ margin: 0 }}>
              <b>What this means:</b> the two biggest prediction markets price the same question {r.h1.verdict === "rejected" ? "very closely" : "close, but not identically"}.
              Fees, different users (US accounts on Kalshi, crypto wallets on Polymarket) and the cost of moving money between them are reasons small gaps
              can last; we don&apos;t measure those here. This describes the past; it isn&apos;t a trading signal.{" "}
              <Link href="/categories">See the gaps by category →</Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
