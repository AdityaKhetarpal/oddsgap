"""Second probe: sports game listings and price-history formats on both platforms (public data, no keys)."""
import json, time
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent.parent / "data" / "raw" / "samples"
OUT.mkdir(parents=True, exist_ok=True)
H = {"User-Agent": "oddsgap research project (github.com/AdityaKhetarpal/oddsgap)", "Accept": "application/json"}
K = "https://api.elections.kalshi.com/trade-api/v2"
G = "https://gamma-api.polymarket.com"
log = []

def get(name, url, params=None):
    try:
        r = requests.get(url, params=params, headers=H, timeout=60)
        log.append({"name": name, "url": r.url, "status": r.status_code, "bytes": len(r.text)})
        try:
            data = r.json()
        except ValueError:
            data = {"_text": r.text[:3000]}
        (OUT / f"{name}.json").write_text(json.dumps(data, indent=1)[:300_000])
        time.sleep(0.4)
        return data if r.ok else None
    except Exception as e:
        log.append({"name": name, "url": url, "error": str(e)})

# Polymarket: closed game events per league series
for lg, sid in [("nba", 10345), ("nfl", 12185), ("mlb", 3), ("nhl", 10346)]:
    get(f"p2_events_keyset_{lg}", f"{G}/events/keyset", {"series_id": sid, "closed": "true", "limit": 4})
    get(f"p2_events_list_{lg}", f"{G}/events", {"series_id": sid, "closed": "true", "limit": 4, "order": "startDate", "ascending": "false"})
    get(f"p2_teams_{lg}", f"{G}/teams", {"league": lg, "limit": 200})
get("p2_event_slug", f"{G}/events/slug/nba-por-min-2026-11-17")
get("p2_events_keyset_nba_old", f"{G}/events/keyset", {"series_id": 10345, "closed": "true", "limit": 3, "end_date_max": "2025-03-01T00:00:00Z"})
get("p2_events_fed", f"{G}/public-search", {"q": "Fed decision", "events_status": "closed", "limit_per_type": 40})

# Kalshi: game events (settled) and price candles in both formats
ev = get("p2_k_events_nba", f"{K}/events", {"series_ticker": "KXNBAGAME", "status": "settled", "limit": 3, "with_nested_markets": "true"})
hev = get("p2_k_hist_events_nba", f"{K}/historical/events", {"series_ticker": "KXNBAGAME", "limit": 3})
m = get("p2_k_markets_nba", f"{K}/markets", {"series_ticker": "KXNBAGAME", "status": "settled", "limit": 2})
if m and m.get("markets"):
    mk = m["markets"][0]
    t0 = int(time.mktime(time.strptime(mk["open_time"][:19], "%Y-%m-%dT%H:%M:%S")))
    t1 = int(time.mktime(time.strptime(mk["close_time"][:19], "%Y-%m-%dT%H:%M:%S"))) + 3600
    get("p2_k_candles_batch", f"{K}/markets/candlesticks", {"market_tickers": ",".join(x["ticker"] for x in m["markets"]), "period_interval": 60, "start_ts": t0, "end_ts": t1})
    get("p2_k_candles_series", f"{K}/series/KXNBAGAME/markets/{mk['ticker']}/candlesticks", {"period_interval": 60, "start_ts": t0, "end_ts": t1})
h = get("p2_k_hist_markets_nba", f"{K}/historical/markets", {"series_ticker": "KXNBAGAME", "limit": 2})
if h and h.get("markets"):
    mk = h["markets"][0]
    t0 = int(time.mktime(time.strptime(mk["open_time"][:19], "%Y-%m-%dT%H:%M:%S")))
    t1 = int(time.mktime(time.strptime(mk["close_time"][:19], "%Y-%m-%dT%H:%M:%S"))) + 3600
    get("p2_k_hist_candles", f"{K}/historical/markets/{mk['ticker']}/candlesticks", {"period_interval": 60, "start_ts": t0, "end_ts": t1})
get("p2_k_fed_event", f"{K}/events/KXFEDDECISION-26OCT", {"with_nested_markets": "true"})
get("p2_k_fed_markets", f"{K}/markets", {"event_ticker": "KXFEDDECISION-26OCT"})
get("p2_k_fed_hist", f"{K}/historical/markets", {"series_ticker": "KXFEDDECISION", "limit": 30})

(OUT / "_log2.json").write_text(json.dumps(log, indent=1))
print(json.dumps(log, indent=1))
