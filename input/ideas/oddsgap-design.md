---
title: "When Kalshi and Polymarket price the same event, how far apart are they, do the gaps close, and which is more accurate?"
type: design
created: 2026-11-18
updated: 2026-11-18
tags: [prediction-markets, market-microstructure, kalshi, polymarket, calibration]
status: approved
author: mixed
---

# OddsGap: same event, two prices

Approved by Aditya on 18 Nov 2026 ("go with the second project … all permissions granted"). He asked for one-shot delivery,
so the section-by-section sign-off was replaced by his standing approval.

## Research question
When the two biggest prediction markets list the **same yes/no question**, how far apart are their prices? Do the gaps close
as the event gets near? And which platform turned out more accurate?

## Why now (short)
- Kalshi (a regulated US exchange) and Polymarket (crypto-based) both post record volumes in 2026. Kalshi alone handled about
  two-thirds of a record $701.7M day in January 2026.
- A February 2026 study measured calibration on each platform separately (arXiv 2602.19520). It did not pair identical events
  across the two. Price gaps between platforms are the cleanest test of whether these markets act as one "crowd".

## Method
1. **Get the data:** settled yes/no markets from both public APIs (no keys).
2. **Match identical questions.** Use rules where the structure is clear (sports games by league, date and teams; Fed decisions
   by meeting and outcome). Then a small embedding model ranks remaining candidates by text similarity. Every match category is
   checked by hand on a sample, and its precision is published.
3. **Line up prices:** both price histories go onto one 3-hour grid (Polymarket keeps 3-hour history permanently; Kalshi
   hourly candles are resampled to 3 hours).
4. **Measure:** the gap per pair (median absolute difference in percentage points), how gaps change as the close approaches,
   and Brier scores (the standard accuracy score for probability forecasts) 24 hours before the close.
5. **Website:** Next.js on Vercel with GSAP, Vanta and Lenis. The opening screen answers the question with one number and one chart.

Rejected alternatives: building a trading or arbitrage strategy (not the goal, and real-money prediction trading isn't allowed
from India); single-platform calibration (already published).

## Data
- **Kalshi trade API v2** (public market data): settled markets and hourly candlesticks.
- **Polymarket Gamma API** (market list and metadata) and **Polymarket Data API** `prices-history` (3-hour series, kept back to 2022).
- **Window:** markets that closed between 1 Jan 2025 and 31 Oct 2026.

## Output
☑ GitHub repo + live website at odds-gap.vercel.app · ☑ README with measured numbers and CV bullets

## Expected results
A clear gap figure (for example, "the median matched pair differed by X points"), whether it shrinks near the close,
and an accuracy comparison with a range. A null result ("no accuracy difference") is just as reportable.

## Risks
- **False matches** (two questions that look alike but resolve differently): rules first, hand-checked precision per category,
  and any pair whose two platforms resolved *differently* is flagged and reported, not silently dropped.
- **Thin markets:** gaps in illiquid markets are noise. A minimum volume on both sides is fixed in the plan.
- **API limits or missing history:** logged per market. Months or categories with poor coverage are reported.
- **Platforms differ in fees and in who can trade** (Kalshi: US KYC; Polymarket: crypto wallets). This is a reason gaps can
  persist, not something we can measure.
- **Not advice:** descriptive analysis only; no trading signals.

## Not investigated
Trading or arbitrage profits; order-book depth; individual traders; markets on other platforms; multi-outcome markets
(only yes/no pairs).

## Skills used (same as SIP Pulse)
brainstorming-research → writing-research-plan → fintech checklist → design-council → ux-copy → design-critique →
design-review → Vercel deploy. Bright Data: not needed (public APIs). RAG pipeline: not part of this project.
