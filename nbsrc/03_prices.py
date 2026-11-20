# %% [markdown]
# # 03 · Download price histories for the sampled pairs
# Both histories go onto one **3-hour grid** (UTC times that are multiples of 3 hours).
# - **Kalshi:** hourly candles. Price = the bid-ask midpoint when both sides of the order book exist, otherwise the last
#   trade price. The grid value is the last hourly candle inside each 3-hour step.
# - **Polymarket:** the Data API's 3-hour price series (kept permanently since 2022).
# Runs in GitHub Actions.

# %%
from pathlib import Path
import time
import numpy as np
import pandas as pd
import requests

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
KALSHI = "https://api.elections.kalshi.com/trade-api/v2"
POLY_HISTORY = "https://data-api.polymarket.com/v2/prices-history"
HEADERS = {"User-Agent": "oddsgap research project (github.com/AdityaKhetarpal/oddsgap)", "Accept": "application/json"}
STEP = 3 * 3600

def get(url, params=None):
    for attempt in range(5):
        try:
            r = requests.get(url, params=params, headers=HEADERS, timeout=60)
        except requests.RequestException:
            time.sleep(2 ** attempt)
            continue
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(2 ** attempt)
            continue
        time.sleep(0.12)
        return r.json() if r.ok else None
    return None

data = pd.read_parquet(OUT / "pairs.parquet")
data = data[data["in_sample"]].reset_index(drop=True)
print(len(data), "pairs")

# %% [markdown]
# ### Which Kalshi endpoint holds each market
# Markets settled before Kalshi's "historical cutoff" moved to the historical endpoints.

# %%
cutoff = pd.Timestamp(get(KALSHI + "/historical/cutoff")["market_settled_ts"])
data["kalshi_historical"] = pd.to_datetime(data["kalshi_close"], utc=True) < cutoff
print("cutoff:", cutoff, "·", int(data["kalshi_historical"].sum()), "historical,", int((~data["kalshi_historical"]).sum()), "recent")

# %% [markdown]
# ### Read one Kalshi candle
# Recent and historical candles name their fields slightly differently ("close_dollars" vs "close"), so I read both.

# %%
def num(block, name):
    if not isinstance(block, dict):
        return np.nan
    v = block.get(f"{name}_dollars", block.get(name))
    try:
        return float(v)
    except (TypeError, ValueError):
        return np.nan

def kalshi_price(c):
    bid, ask = num(c.get("yes_bid"), "close"), num(c.get("yes_ask"), "close")
    if bid > 0 and ask < 1 and ask >= bid:                  # both sides of the book exist
        return (bid + ask) / 2
    last = num(c.get("price"), "close")
    return last if not np.isnan(last) else num(c.get("price"), "previous")

# %% [markdown]
# ### Download Kalshi hourly candles for one market
# A request may cover at most 5,000 hours, so long-running markets (Fed meetings) are fetched in pieces.

# %%
def kalshi_candles(row):
    start = int(pd.Timestamp(row.kalshi_open).timestamp())
    end = int(pd.Timestamp(row.kalshi_close).timestamp()) + 3600
    url = (f"{KALSHI}/historical/markets/{row.kalshi_ticker}/candlesticks" if row.kalshi_historical
           else f"{KALSHI}/series/{row.kalshi_series}/markets/{row.kalshi_ticker}/candlesticks")
    out = []
    for s in range(start, end, 4900 * 3600):
        page = get(url, {"period_interval": 60, "start_ts": s, "end_ts": min(end, s + 4900 * 3600)})
        for c in (page or {}).get("candlesticks", []):
            out.append((int(c["end_period_ts"]), kalshi_price(c)))
    return out

# %% [markdown]
# ### Download the Polymarket 3-hour series for one outcome

# %%
def poly_history(token):
    out, cursor = [], None
    while True:
        page = get(POLY_HISTORY, {"token_id": token, "interval": "max", "bucket_seconds": STEP, **({"cursor": cursor} if cursor else {})})
        if not page:
            break
        out += [(int(p["timestamp"]), float(p["price"])) for p in page.get("data", []) if p.get("resolution_seconds") == STEP]
        cursor = (page.get("pagination") or {}).get("next_cursor")
        if not cursor:
            break
    return out

# %% [markdown]
# ### Put both on the 3-hour grid
# Kalshi: the last hourly candle in each 3-hour step, labelled with the step's end. Polymarket: its own 3-hour timestamps,
# which already fall on the same grid.

# %%
rows, missing = [], []
for i, row in enumerate(data.itertuples()):
    k = [(t, p) for t, p in kalshi_candles(row) if not np.isnan(p)]
    pm = poly_history(row.poly_token)
    if not k or not pm:
        missing.append({"pair_id": row.pair_id, "kalshi_points": len(k), "poly_points": len(pm)})
        continue
    kd = pd.DataFrame(k, columns=["ts", "price"])
    kd["grid"] = ((kd["ts"] + STEP - 1) // STEP) * STEP            # round each hour's end up to the 3-hour step it closes
    kd = kd.sort_values("ts").groupby("grid")["price"].last()
    for t, p in kd.items():
        rows.append((row.pair_id, "kalshi", t, p))
    for t, p in pm:
        rows.append((row.pair_id, "polymarket", t - t % STEP, p))
    if i % 200 == 0:
        print(i, "pairs done", flush=True)

data = pd.DataFrame(rows, columns=["pair_id", "platform", "ts", "price"]).drop_duplicates(["pair_id", "platform", "ts"], keep="last")
data.to_parquet(OUT / "prices.parquet", index=False)
pd.DataFrame(missing).to_csv(OUT / "prices_missing.csv", index=False)
print(len(data), "price points ·", data["pair_id"].nunique(), "pairs with both histories ·", len(missing), "pairs missing a history")
data.groupby("platform").size()
