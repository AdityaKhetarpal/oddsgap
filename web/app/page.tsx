import Link from "next/link";
import Vanta from "@/components/Vanta";
import PairChart from "@/components/PairChart";
import { overview, curve, totals, num, pp, dateName, timeName, moment, CATEGORY_NAME } from "@/lib/data";

const LD = {"@context": "https://schema.org", "@type": "Dataset", "name": "OddsGap: Kalshi vs Polymarket prices on identical questions", "description": "7,556 yes/no questions listed on both Kalshi and Polymarket (NBA, NFL, MLB and NHL games, Fed rate decisions), with both prices every 3 hours and a pre-registered test of the gap between them, January 2025 to October 2026.", "url": "https://odds-gap.vercel.app", "temporalCoverage": "2025-01/2026-10", "keywords": ["prediction markets", "Kalshi", "Polymarket", "market microstructure", "calibration"], "isBasedOn": ["https://kalshi.com", "https://polymarket.com"], "sameAs": "https://github.com/AdityaKhetarpal/oddsgap", "creator": {"@type": "Person", "name": "Aditya Khetarpal", "url": "https://www.linkedin.com/in/adityakhetarpal"}};

export default function Home() {
  const r = overview.results;
  const t = totals();
  const hero = overview.hero;
  const m = moment(hero);
  const gap = r.h1.value;
  const over2 = overview.histogram.filter((b) => b.from >= 2).reduce((s, b) => s + b.pairs, 0);
  const over2pct = (100 * over2) / r.pairs_tested;
  const lead = r.lead;
  // a leader only if one direction shows a real (|r| > 0.05) and clearly larger link
  const leader = Math.max(Math.abs(lead.kalshi_then_poly), Math.abs(lead.poly_then_kalshi)) < 0.05 ? null : lead.kalshi_then_poly > lead.poly_then_kalshi ? "Kalshi" : "Polymarket";
  const d = r.detail;
  const g = (v: number) => (v < 1 ? v.toFixed(2) : v.toFixed(1));
  const p1 = (v: number) => (Number.isInteger(Math.round(v * 10) / 10) ? v.toFixed(0) : v.toFixed(1));
  // the funnel runs from furthest to nearest, so it narrows towards the close
  const far = [...curve].reverse();
  const fmax = Math.max(...curve.map((c) => c.mean_gap_pp));
  const narrows = r.h2.verdict === "supported";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <section className="hero">
        <Vanta />
        <div className="wrap">
          <p className="eyebrow"><i aria-hidden="true" />Kalshi vs Polymarket, on {num(t.matched)} identical questions</p>
          <h1>Same question, {gap < 2 ? "nearly the same" : "different"} odds: a typical gap of {g(gap)} points.</h1>
          <p className="lead">
            NBA, NFL, MLB and NHL games and Fed rate decisions listed on both platforms, January 2025 to October 2026, with both prices compared
            every 3 hours: {num(r.points)} times.
          </p>
          <div className="actions">
            <Link className="btn" href="/pairs">Explore the pairs</Link>
            <Link className="btn ghost" href="/method">How we tested it</Link>
          </div>

          <div className="ticket" role="group" aria-label={`One real moment: Kalshi ${p1(m.k)}%, Polymarket ${p1(m.p)}%, a ${p1(m.gap)}-point gap`}>
            <div className="half k">
              <span className="who">Kalshi</span>
              <span className="price">{p1(m.k)}%</span>
              <span className="q">{hero.kalshi_question}</span>
            </div>
            <div className="seam" aria-hidden="true"><b>{p1(m.gap)}</b><small>pt gap</small></div>
            <div className="half p">
              <span className="who">Polymarket</span>
              <span className="price">{p1(m.p)}%</span>
              <span className="q">{hero.poly_question}</span>
            </div>
          </div>
          <p className="ticket-cap">
            A real moment: both prices at {timeName(m.t)}, {Math.round((Date.parse(hero.date + "T12:00:00Z") / 1000 - m.t) / 86400)} days before
            the {hero.category === "Fed" ? "Fed decision" : `${hero.category} game`} on {dateName(hero.date)}. A point is one percentage point:
            {" "}{p1(m.k)}% against {p1(m.p)}% is a {p1(m.gap)}-point gap.
          </p>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <div className="band-head">
            <h2>One real pair, start to finish</h2>
            <p>
              {CATEGORY_NAME[hero.category]}, {dateName(hero.date)}. Chosen by a fixed rule: the much-traded pair whose gap ({g(hero.gap_pp)} pts) is closest to the
              overall median. Where the lines overlap, the prices were equal.
            </p>
          </div>
          <div className="card">
            <div className="qpair">
              <div className="qk"><b>Kalshi asks</b>{hero.kalshi_question}</div>
              <div className="qp"><b>Polymarket asks</b>{hero.poly_question}</div>
            </div>
            <PairChart series={hero.series} draw height={300} />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="band-head">
            <h2>{narrows ? "The gap closes as the end gets near" : "Does the gap close as the end gets near?"}</h2>
            <p>
              Average gap by time left before the market closed, furthest first. The last 3 hours are left out, because prices there jump to 0% or 100%.
              (The locked test uses medians; averages show the same shape more finely.)
            </p>
          </div>
          <div className="card">
            <div className="legend"><span><i className="lk" />Kalshi&apos;s side</span><span><i className="lp" />Polymarket&apos;s side</span><span><i className="lg" />Average gap, centred where the prices would meet</span></div>
            <div className="funnel" role="img" aria-label={`Average gap by time left: ${far.map((c) => `${c.time_left} ${c.mean_gap_pp.toFixed(2)} points`).join(", ")}`}>
              {far.map((c, i) => (
                <div key={c.time_left} className={`frow${i === far.length - 1 ? " last" : ""}`}>
                  <span className="fl">{c.time_left} left</span>
                  <span className="ft"><span className="fb" style={{ "--w": `${Math.max(3, (100 * c.mean_gap_pp) / fmax)}%` } as React.CSSProperties} /></span>
                  <span className="fv">{c.mean_gap_pp.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="source">Values in points. Every comparable 3-hour point across {num(r.pairs_tested)} tested pairs. Source: Kalshi and Polymarket public APIs, Jan 2025 to Oct 2026.</p>
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <div className="band-head">
            <h2>Five questions, three of them decided in advance</h2>
            <p>
              The three tests were written down and locked before any market data was downloaded, so the answers couldn&apos;t be bent to fit. The last two are
              reported for context and decide nothing. The matching was checked by hand: {t.correct} of {t.reviewed} sampled pairs were the same question.
            </p>
          </div>
          <div className="board">
            <article className="result">
              <span className="tag locked">Locked test</span>
              <h3 className="q">Do the two platforms disagree by 2 points or more?</h3>
              <div>
                <p className="a">{r.h1.verdict === "supported" ? "Yes." : r.h1.verdict === "rejected" ? "No: the gap is smaller." : "Too close to call."}</p>
                <p className="small">The median pair gap is {pp(gap, 2)} (90% range {r.h1.low.toFixed(2)} to {r.h1.high.toFixed(2)}, {num(r.h1.n)} pairs). Only {over2pct.toFixed(0)}% of pairs differed by 2 points or more, and the prices were identical at {d.identical_share.toFixed(0)}% of moments.</p>
              </div>
            </article>
            <article className="result">
              <span className="tag locked">Locked test</span>
              <h3 className="q">Is the gap smaller in the last 24 hours than 3+ days out?</h3>
              <div>
                <p className="a">{narrows ? "Yes, it narrows." : "No clear narrowing."}</p>
                <p className="small">
                  Over {num(r.h2.n)} pairs open that long: {pp(r.h2.far_median, 2)} more than 3 days out, {pp(r.h2.near_median, 2)} in the last day.
                  Change {r.h2.value.toFixed(2)} (90% range {r.h2.low.toFixed(2)} to {r.h2.high.toFixed(2)}).
                </p>
              </div>
            </article>
            <article className="result">
              <span className="tag locked">Locked test</span>
              <h3 className="q">Was one platform more accurate a day before the close?</h3>
              <div>
                <p className="a">{r.h3.verdict === "supported" ? "No: equally accurate." : `Yes: ${r.h3.better === "kalshi" ? "Kalshi" : "Polymarket"}.`}</p>
                <div className="duo" role="group" aria-label={`Brier score: Kalshi ${r.h3.brier_kalshi.toFixed(4)}, Polymarket ${r.h3.brier_polymarket.toFixed(4)}`}>
                  <div className="dk"><small>Kalshi</small><b>{r.h3.brier_kalshi.toFixed(4)}</b></div>
                  <div className="dg" aria-hidden="true"><span>{Math.abs(r.h3.value).toFixed(4)}</span></div>
                  <div className="dp"><small>Polymarket</small><b>{r.h3.brier_polymarket.toFixed(4)}</b></div>
                </div>
                <p className="small">
                  Brier score (lower is better) over {num(r.h3.n)} pairs. The difference, {r.h3.value.toFixed(4)}, has a 90% range of {r.h3.low.toFixed(4)} to {r.h3.high.toFixed(4)}
                  {r.h3.low < 0 && r.h3.high > 0 ? ", which includes zero." : "."}
                </p>
              </div>
            </article>
            <article className="result">
              <span className="tag">Reported, not tested</span>
              <h3 className="q">Who moves first?</h3>
              <div>
                <p className="a">{leader ? `${leader}, slightly.` : "Neither, at 3-hour steps."}</p>
                <p className="small">
                  The two prices move together within the same 3-hour step (correlation {lead.same_step.toFixed(2)}). One platform&apos;s move predicting the
                  other&apos;s next move: Kalshi then Polymarket {lead.kalshi_then_poly.toFixed(3)}, Polymarket then Kalshi {lead.poly_then_kalshi.toFixed(3)},
                  over {num(lead.steps)} steps. Finer timing would need minute-level data.
                </p>
              </div>
            </article>
            <article className="result">
              <span className="tag">Reported, not tested</span>
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
        </div>
      </section>

      <section className="close">
        <div className="wrap">
          <h2>The two biggest prediction markets price the same question {gap < 1.25 ? "within about a point" : gap < 2 ? "within two points" : "close, but not identically"}.</h2>
          <p>
            Fees, different users (US accounts on Kalshi, crypto wallets on Polymarket) and the cost of moving money between them are reasons small gaps can last;
            we don&apos;t measure those here. This describes the past. It isn&apos;t a trading signal.
          </p>
          <div className="actions">
            <Link className="btn" href="/pairs">Explore the pairs</Link>
            <Link className="btn ghost" href="/categories">See the gaps by category</Link>
          </div>
        </div>
      </section>
    </>
  );
}
