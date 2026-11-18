"""Save small samples of every API response the project will use, so the matching and parsing code is built on real shapes.
Runs in GitHub Actions (the APIs are public; no keys)."""
import json, time
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent.parent / "data" / "raw" / "samples"
OUT.mkdir(parents=True, exist_ok=True)
H = {"User-Agent": "oddsgap research project (github.com/AdityaKhetarpal/oddsgap)", "Accept": "application/json"}
KALSHI = ["https://api.elections.kalshi.com/trade-api/v2", "https://external-api.kalshi.com/trade-api/v2"]
GAMMA = "https://gamma-api.polymarket.com"
log = []

def get(name, url, params=None):
    try:
        r = requests.get(url, params=params, headers=H, timeout=60)
        body = r.text
        log.append({"name": name, "url": r.url, "status": r.status_code, "bytes": len(body)})
        try:
            data = r.json()
        except ValueError:
            data = {"_text": body[:3000]}
        (OUT / f"{name}.json").write_text(json.dumps(data, indent=1)[:400_000])
        time.sleep(0.4)
        return data if r.ok else None
    except Exception as e:
        log.append({"name": name, "url": url, "error": str(e)})
        return None

# ---------- Kalshi ----------
base = None
for b in KALSHI:
    if get("kalshi_exchange_status" if base is None else "x", f"{b}/exchange/status") is not None:
        base = b
        break
log.append({"kalshi_base": base})
if base:
    get("kalshi_cutoff", f"{base}/historical/cutoff")
    get("kalshi_series_sports", f"{base}/series", {"category": "Sports"})
    get("kalshi_series_all", f"{base}/series")
    for s in ["KXNBAGAME", "KXNFLGAME", "KXMLBGAME", "KXNHLGAME", "KXNCAAFGAME", "KXFEDDECISION", "KXEPLGAME"]:
        m = get(f"kalshi_markets_{s}", f"{base}/markets", {"series_ticker": s, "status": "settled", "limit": 6})
        get(f"kalshi_hist_markets_{s}", f"{base}/historical/markets", {"series_ticker": s, "limit": 6})
        if m and m.get("markets"):
            t = [x["ticker"] for x in m["markets"][:2]]
            close = m["markets"][0].get("close_time")
            get(f"kalshi_candles_{s}", f"{base}/markets/candlesticks",
                {"tickers": ",".join(t), "period_interval": 60, "start_ts": int(time.time()) - 86400 * 60, "end_ts": int(time.time())})
            get(f"kalshi_event_{s}", f"{base}/events/{m['markets'][0]['event_ticker']}", {"with_nested_markets": "true"})
    h = get("kalshi_hist_markets_any", f"{base}/historical/markets", {"limit": 5})
    if h and h.get("markets"):
        tk = h["markets"][0]["ticker"]
        get("kalshi_hist_candles", f"{base}/historical/markets/{tk}/candlesticks", {"period_interval": 60, "start_ts": 1735689600, "end_ts": int(time.time())})
    get("kalshi_events_settled", f"{base}/events", {"status": "settled", "limit": 5, "with_nested_markets": "true"})

# ---------- Polymarket ----------
get("poly_markets_keyset", f"{GAMMA}/markets/keyset", {"closed": "true", "limit": 5})
get("poly_markets_list", f"{GAMMA}/markets", {"closed": "true", "limit": 5, "order": "endDate", "ascending": "false"})
get("poly_markets_list_offset", f"{GAMMA}/markets", {"closed": "true", "limit": 5, "offset": 5000})
get("poly_events_keyset", f"{GAMMA}/events/keyset", {"closed": "true", "limit": 3})
get("poly_events_list", f"{GAMMA}/events", {"closed": "true", "limit": 3, "order": "endDate", "ascending": "false"})
get("poly_sports", f"{GAMMA}/sports")
get("poly_teams", f"{GAMMA}/teams", {"limit": 60, "league": "nba"})
get("poly_tags", f"{GAMMA}/tags", {"limit": 300})
get("poly_search_fed", f"{GAMMA}/public-search", {"q": "Fed decision"})
s = get("poly_search_nba", f"{GAMMA}/public-search", {"q": "Lakers vs"})
tok = None
for name in ["poly_markets_list", "poly_markets_keyset"]:
    try:
        d = json.loads((OUT / f"{name}.json").read_text())
        ms = d if isinstance(d, list) else d.get("markets") or d.get("data") or []
        for mk in ms:
            ids = mk.get("clobTokenIds")
            ids = json.loads(ids) if isinstance(ids, str) else ids
            if ids:
                tok = ids[0]
                break
    except Exception:
        pass
    if tok:
        break
log.append({"poly_sample_token": tok})
if tok:
    get("poly_hist_dataapi_max", "https://data-api.polymarket.com/v2/prices-history", {"token_id": tok, "interval": "max", "bucket_seconds": 10800})
    get("poly_hist_clob", "https://clob.polymarket.com/prices-history", {"market": tok, "interval": "max", "fidelity": 180})

(OUT / "_log.json").write_text(json.dumps(log, indent=1))
print(json.dumps(log, indent=1))
