# OddsGap

**Same event, two prices: when Kalshi and Polymarket list the same yes/no question, how far apart are their odds?**

Live site: **[odds-gap.vercel.app](https://odds-gap.vercel.app)**

7,556 identical questions matched across the two biggest prediction markets: NBA, NFL, MLB and NHL games, and Fed rate decisions,
January 2025 to October 2026. The test was locked **before** any data was downloaded:
[design](input/ideas/oddsgap-design.md) · [plan](input/ideas/oddsgap-plan.md) · [change log](knowledge/_meta/log.md).

## Results

| | |
|---|---|
| Questions matched | 7,556 (7,504 games, 52 Fed outcomes); **125 of 125** correct when checked by hand (25 per category) |
| Pairs tested | 1,457 (prices every 3 hours, 42,219 moments compared) |
| H1: the platforms differ by 2+ points | **Rejected.** Median gap **0.75 points** (90% bootstrap range 0.75–1.00); only 5% of pairs differ by 2+ points |
| H2: gaps close near the end | **Supported.** 1.00 point more than 3 days out → 0.00 in the last 24 hours (change 1.00, range 0.75–1.00) |
| H3: equal accuracy a day before the close | **Supported.** Brier score Kalshi 0.2256 vs Polymarket 0.2254 (difference range −0.0002 to 0.0007) |
| Identical prices | 25% of all compared moments |
| Where they disagree most | Fed decisions: 27% of pairs differ by 2+ points, against 2–7% for games |
| Settled differently | 5 of 7,556 pairs, all rescheduled or relabelled games by their dates (listed, not hidden) |
| Who moves first | Neither at 3-hour steps (lagged correlations 0.006 and −0.018) |

## How it works

```
Kalshi API (public) ─┐                        ┌─► 03 prices (3-hour grid) ─► 04 SQL (DuckDB) ─► 05 locked tests ─► 06 export ─► website
                     ├─► 01 list ─► 02 match ─┤
Polymarket APIs ─────┘   markets     (rules)  └─► hand check: 125 pairs
```

| Notebook | What it does |
|---|---|
| [01_acquire](notebooks/01_acquire.ipynb) | Lists every settled market on both platforms for the five categories (GitHub Actions) |
| [02_match](notebooks/02_match.ipynb) | Matches games by league, date and both teams, finding team-code differences from the data; matches Fed outcomes by meeting and definition |
| [03_prices](notebooks/03_prices.ipynb) | Kalshi hourly candles (bid-ask midpoint) and Polymarket's 3-hour series onto one grid (GitHub Actions) |
| [04_sql](notebooks/04_sql.ipynb) | DuckDB: comparable points, gap per pair, gap by time left |
| [05_analysis](notebooks/05_analysis.ipynb) | H1–H3 with 10,000-sample bootstraps, plus categories, lead-lag, settlement mismatches and a timestamp-alignment check |
| [06_export](notebooks/06_export.ipynb) | Small JSON files for the website |

Website: Next.js on Vercel, custom SVG charts, GSAP (the two lines draw themselves and meet), Vanta and Lenis.
Design decisions: [DESIGN.md](DESIGN.md) · copy: [docs/copy.md](docs/copy.md).

## Run it

```bash
pip install -r requirements.txt
python scripts/run_notebooks.py 01 02 03 04 05 06     # 01 and 03 call the public APIs
cd web && npm install && npm run dev
```

## Limits

- 3-hour steps: fast moves inside a step are invisible.
- Mostly sports; only 41 Fed outcomes were tested. Polymarket's NFL listings only start with the 2026 season.
- Prices were downloaded for a random 600 liquid games per league (seed 42) plus every liquid Fed pair.
- Fees, user bases and the cost of moving money between platforms are reasons gaps can last; they are not measured here.
- Descriptive research only. Not trading advice. Not affiliated with Kalshi or Polymarket.
