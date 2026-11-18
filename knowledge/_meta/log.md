# Log

- 2026-11-18 · oddsgap-plan · Plan locked (pre-registered) before any market data was downloaded.
- 2026-11-18 · oddsgap-plan · **Changes made after seeing API response samples, before any market list or price was downloaded.**
  1. Matching uses rules only (games: league + date + both team codes; Fed: meeting + identically defined outcome). Every pair
     in these categories follows a fixed rule, so the embedding step for "remaining" markets is not needed. Team-code aliases
     between platforms are found from the data (≥3 consistent games) and published.
  2. Prices are downloaded for all liquid Fed pairs and a random 600 liquid games per league (seed 42), drawn before any price
     is seen, instead of every liquid pair, to keep the download within a few hours.
  3. Doubleheader second games (Polymarket slugs ending in "-2") are skipped, because Kalshi tells the two games apart only by start time.
  4. Polymarket's 3-hour price timestamps are taken as the time of the price; Kalshi's hourly candles are labelled by their end.
     If Polymarket labels the *start* of each bucket instead, prices could be offset by up to 3 hours. This is listed as a limit.
- 2026-11-18 · oddsgap-plan · **Matching fixes after the first market-list run, before any price was downloaded.**
  The check of pairs that settled differently found two matching problems, now fixed by rule: (1) MLB doubleheader games
  (Kalshi tickers ending G1/G2) were paired with the wrong Polymarket game, so all doubleheader games are dropped; (2) a few
  pairs closed days or months apart (rescheduled games; one Polymarket Fed event that closed in May for a September meeting),
  so pairs must close within 24 hours of each other. Coverage note: Polymarket's NFL series only lists the 2026 season.
