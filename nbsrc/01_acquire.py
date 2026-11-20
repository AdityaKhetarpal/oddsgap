# %% [markdown]
# # 01 · List every settled market on both platforms
# Kalshi and Polymarket both publish market data openly (no keys). This notebook downloads the list of settled markets for
# the categories both platforms cover in the same yes/no form: **NBA, NFL, MLB and NHL games** and **Fed rate decisions**.
# Runs in GitHub Actions. Prices come later, in notebook 03, only for matched pairs.

# %% [markdown]
# ### Settings

# %%
from pathlib import Path
import json, time
import pandas as pd
import requests

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)
KALSHI = "https://api.elections.kalshi.com/trade-api/v2"
GAMMA = "https://gamma-api.polymarket.com"
HEADERS = {"User-Agent": "oddsgap research project (github.com/AdityaKhetarpal/oddsgap)", "Accept": "application/json"}
WINDOW = ("2025-01-01", "2026-10-31")                      # Kalshi close dates in the locked window
KALSHI_SERIES = {"KXNBAGAME": "NBA", "KXNFLGAME": "NFL", "KXMLBGAME": "MLB", "KXNHLGAME": "NHL", "KXFEDDECISION": "Fed"}
POLY_SERIES = {"NBA": 10345, "NFL": 12185, "MLB": 3, "NHL": 10346}   # Polymarket's league series ids

# %% [markdown]
# ### A polite downloader
# Waits a little between requests, retries when the server says "too many requests" (HTTP 429), and gives up after 5 tries.

# %%
def get(url, params=None):
    for attempt in range(5):
        r = requests.get(url, params=params, headers=HEADERS, timeout=60)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(2 ** attempt)                          # back off: 1, 2, 4, 8 seconds
            continue
        time.sleep(0.15)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"gave up on {url}")

# %% [markdown]
# ### Kalshi: settled markets
# Kalshi keeps recent settled markets at `/markets` and moves older ones to `/historical/markets`. I page through both
# for each series and keep one row per market.

# %%
def kalshi_markets(series):
    rows = []
    for path, extra in [("/markets", {"status": "settled"}), ("/historical/markets", {})]:
        cursor = None
        while True:
            page = get(KALSHI + path, {"series_ticker": series, "limit": 1000, **extra, **({"cursor": cursor} if cursor else {})})
            if not page:
                break
            rows += page.get("markets", [])
            cursor = page.get("cursor")
            if not cursor or not page.get("markets"):
                break
    return rows

rows = []
for series, league in KALSHI_SERIES.items():
    got = kalshi_markets(series)
    print(series, len(got), "markets")
    for m in got:
        m["league"] = league
        m["series_ticker"] = series
    rows += got
data = pd.DataFrame(rows).drop_duplicates("ticker")
print(len(data), "Kalshi markets")
data[["ticker", "event_ticker", "yes_sub_title", "close_time", "result", "volume_fp"]].head()

# %% [markdown]
# ### Keep the columns I need, inside the window

# %%
keep = ["ticker", "event_ticker", "series_ticker", "league", "title", "yes_sub_title", "open_time", "close_time",
        "result", "volume_fp", "volume", "status"]
data = data[[c for c in keep if c in data.columns]].copy()
data["close_time"] = pd.to_datetime(data["close_time"], utc=True, format="ISO8601")
data["open_time"] = pd.to_datetime(data["open_time"], utc=True, format="ISO8601")
data["volume"] = pd.to_numeric(data.get("volume_fp", data.get("volume")), errors="coerce")   # contracts traded ($1 each at most)
data = data[(data["close_time"] >= pd.Timestamp(WINDOW[0], tz="UTC")) & (data["close_time"] < pd.Timestamp(WINDOW[1], tz="UTC") + pd.Timedelta(days=1))]
data = data[data["result"].isin(["yes", "no"])]                                              # drop voided markets
data.drop(columns=["volume_fp"], errors="ignore").to_parquet(RAW / "kalshi_markets.parquet", index=False)
data.groupby("league").size()

# %% [markdown]
# ### Polymarket: closed game events per league
# Polymarket groups each league's games into a series. Each game event has a slug like `nba-phx-lal-2025-10-03` and a
# "moneyline" market with one outcome per team.

# %%
def poly_events(series_id):
    out, cursor = [], None
    while True:
        page = get(GAMMA + "/events/keyset", {"series_id": series_id, "closed": "true", "limit": 200,
                                              **({"after_cursor": cursor} if cursor else {})})
        if not page:
            break
        out += page.get("events", [])
        cursor = page.get("next_cursor")
        if not cursor or not page.get("events"):
            break
    return out

rows = []
for league, sid in POLY_SERIES.items():
    evs = poly_events(sid)
    print(league, len(evs), "events")
    for e in evs:
        for m in e.get("markets", []):
            if m.get("sportsMarketType") != "moneyline":
                continue                                          # spreads and totals have no Kalshi twin here
            rows.append({"league": league, "event_slug": e.get("slug"), "event_title": e.get("title"),
                         "game_start": m.get("gameStartTime") or e.get("startTime"), "question": m.get("question"),
                         "outcomes": m.get("outcomes"), "outcome_prices": m.get("outcomePrices"),
                         "token_ids": m.get("clobTokenIds"), "volume": m.get("volumeNum"),
                         "closed_time": m.get("closedTime"), "end_date": m.get("endDate"), "condition_id": m.get("conditionId")})
data = pd.DataFrame(rows)
print(len(data), "Polymarket moneyline markets")
data.head()

# %% [markdown]
# ### Polymarket: Fed decision events
# Polymarket has one event per Fed meeting ("Fed decision in October?") with one yes/no market per outcome.

# %%
fed = []
for q in ["Fed decision in", "Fed Decision in"]:
    page = get(GAMMA + "/public-search", {"q": q, "events_status": "closed", "limit_per_type": 100})
    for e in (page or {}).get("events", []):
        if not e.get("title", "").lower().startswith("fed decision in"):
            continue
        for m in e.get("markets", []):
            fed.append({"league": "Fed", "event_slug": e.get("slug"), "event_title": e.get("title"), "game_start": None,
                        "question": m.get("question"), "group_title": m.get("groupItemTitle"), "outcomes": m.get("outcomes"),
                        "outcome_prices": m.get("outcomePrices"), "token_ids": m.get("clobTokenIds"), "volume": m.get("volumeNum"),
                        "closed_time": m.get("closedTime"), "end_date": m.get("endDate") or e.get("endDate"),
                        "condition_id": m.get("conditionId")})
fed = pd.DataFrame(fed).drop_duplicates("condition_id")
print(len(fed), "Polymarket Fed outcome markets in", fed["event_slug"].nunique(), "meetings")
data = pd.concat([data, fed], ignore_index=True)
data.to_parquet(RAW / "poly_markets.parquet", index=False)
data.groupby("league").size()

# %% [markdown]
# ### Polymarket team codes
# The slug uses Polymarket's team codes. I save each league's team list to check codes against Kalshi's.

# %%
teams = []
for league in ["nba", "nfl", "mlb", "nhl"]:
    for t in get(GAMMA + "/teams", {"league": league, "limit": 500}) or []:
        teams.append({"league": league.upper(), "name": t.get("name"), "abbreviation": (t.get("abbreviation") or "").lower()})
pd.DataFrame(teams).to_parquet(RAW / "poly_teams.parquet", index=False)
print(len(teams), "teams")

# %% [markdown]
# ### Write down where the data came from

# %%
from datetime import date
(ROOT / "data" / "SOURCES.md").write_text(f"""# Data sources (downloaded {date.today()})

- **Kalshi trade API v2** (public market data, no key): `{KALSHI}` — `/markets`, `/historical/markets`, `/events`,
  `/markets/candlesticks`, `/historical/markets/{{ticker}}/candlesticks`.
- **Polymarket Gamma API** (public): `{GAMMA}` — `/events/keyset` by league series, `/public-search`, `/teams`.
- **Polymarket Data API** (public): `https://data-api.polymarket.com/v2/prices-history` (3-hour buckets, kept since 2022).
- Window: Kalshi markets that closed {WINDOW[0]} to {WINDOW[1]}. Descriptive research only; no trading.
""")
print("saved data/SOURCES.md")
