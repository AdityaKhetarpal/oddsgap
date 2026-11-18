---
title: "OddsGap: same event, two prices"
type: plan
created: 2026-11-18
updated: 2026-11-18
status: pre-registered
author: mixed
design: "[[oddsgap-design]]"
---

# OddsGap: research plan

**Locked on 18 November 2026, before any market data was downloaded.** Approved under Aditya's standing approval
("all permissions granted"). Any later change goes in `knowledge/_meta/log.md`, and the affected result is labelled exploratory.

**Research question:** when Kalshi and Polymarket list the same yes/no question, how far apart are their prices, do the gaps
close near the end, and which platform is more accurate?

## Definitions (fixed now)
- **Matched pair:** one Kalshi market and one Polymarket outcome token that resolve on the same yes/no fact, on the same date.
  The Polymarket price is always taken for the outcome that equals Kalshi's "yes".
- **Window:** pairs whose Kalshi market closed from 1 January 2025 to 31 October 2026.
- **Liquid pair:** at least $1,000 traded on each platform over the market's life. Only liquid pairs enter the tests.
- **Grid:** 3-hour steps (UTC). Kalshi price = the close of the 3-hour bar, using the bid-ask midpoint if both sides exist,
  otherwise the last trade price. Polymarket price = the `prices-history` value for that 3-hour bucket.
- **Comparable point:** a grid time when both platforms have a price, both prices are between 3% and 97%, and the time is
  at least 3 hours before the earlier of the two close times (so settled or nearly-settled prices don't count).
- **Pair gap:** the median of |Kalshi − Polymarket| over that pair's comparable points, in percentage points (pp).
  A pair needs at least 4 comparable points.
- **Bootstrap:** 10,000 resamples of pairs, seed 42, keeping the middle 90%.

## Hypotheses and how each is decided
- **H1, the platforms disagree by a meaningful amount:** the median pair gap is at least 2 pp.
  *Supported* if the whole 90% range of the median pair gap is at or above 2 pp. *Rejected* if the whole range is below 2 pp.
  Otherwise *inconclusive*.
- **H2, gaps close as the end approaches:** for each pair with points in both windows, the gap in the final 24 hours is
  smaller than the gap more than 72 hours out.
  *Supported* if the 90% range of the median per-pair change (far gap − near gap) is entirely above 0. *Rejected* otherwise.
- **H3, neither platform is more accurate:** compare Brier scores using each platform's price at the last comparable point
  at least 24 hours before the earlier close. The Brier score is (price − outcome)², averaged; lower is better.
  *Rejected* (one platform is more accurate) if the 90% range of the mean Brier difference (Kalshi − Polymarket) excludes 0.
  Otherwise *supported*.

**Reported but not deciding anything:** results by category; which platform moves first (the correlation of one platform's
3-hour price change with the other's change one step later); and pairs where the two platforms resolved differently.

**When collection stops:** every settled market in the window that the public APIs return on the run date. Nothing is added later.

## Tasks
### 1 · Get the data (`notebooks/01_acquire.ipynb`, runs in GitHub Actions)
- [ ] Kalshi: list settled markets closing in the window (paged, by series in the chosen categories) → `data/raw/kalshi_markets.parquet`
- [ ] Polymarket: list closed markets in the window (paged) → `data/raw/poly_markets.parquet`
- [ ] Save samples of raw responses to `data/raw/samples/` so the matching rules can be checked
### 2 · Match (`notebooks/02_match.ipynb`)
- [ ] Rule matches: sports games (league + date + both teams), Fed decisions (meeting + outcome), others by exact question rules
- [ ] Embedding-ranked candidates for the remaining markets (all-MiniLM-L6-v2), date within ±1 day, top match above a fixed threshold
- [ ] Hand-check a random sample per category → `data/match_review.csv`; publish precision per category
- [ ] Save `data/pairs.parquet`
### 3 · Prices (`notebooks/03_prices.ipynb`, runs in GitHub Actions)
- [ ] Kalshi hourly candlesticks (batch, 100 tickers per call) → 3-hour grid
- [ ] Polymarket `prices-history` for the matched token → 3-hour grid
- [ ] Save `data/prices.parquet`; log markets with no history
### 4 · Tables in DuckDB (`notebooks/04_sql.ipynb`)
- [ ] Load pairs and prices, join on the grid in SQL, build the `comparable` view and the per-pair gap table
### 5 · Test the hypotheses (`notebooks/05_analysis.ipynb`)
- [ ] H1, H2 and H3 exactly as defined above → `data/results.json`
- [ ] The reported-only checks: categories, who moves first, resolution mismatches
### 6 · Export (`notebooks/06_export.ipynb`) → `web/public/data/*.json`, each under 1 MB
### 7 · Website (Next.js on Vercel): design-council → ux-copy → design-critique and design-review → deploy at oddsgap.vercel.app
### 8 · README with results, 3 CV bullets

## Done when
- [ ] All matched pairs counted, with hand-checked match precision published per category
- [ ] H1, H2 and H3 each have a verdict with numbers
- [ ] The site is live at a clean address, works on a phone in light and dark mode, and every chart has a source line
- [ ] Every commit is in Aditya's name only
