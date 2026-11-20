# %% [markdown]
# # 02 · Match identical questions across the two platforms
# A pair is one Kalshi market and one Polymarket outcome that settle on the same fact on the same day.
# - **Games:** same league, same date, same two teams. The pair asks "does team X win?" on both sides.
# - **Fed decisions:** same meeting, same outcome ("no change", "25 bps cut" …). Only outcomes defined *identically* are paired.

# %%
from pathlib import Path
import json, re
import numpy as np
import pandas as pd

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data"
MONTHS = {m: i + 1 for i, m in enumerate(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"])}
MIN_VOLUME = 1000          # liquid pair: at least this traded on each side (Kalshi contracts, Polymarket dollars)

# %% [markdown]
# ### Kalshi games: date and team codes from the tickers
# Event `KXNBAGAME-26NOV17PORMIN` has two markets, `…-POR` and `…-MIN`. The date is in the event ticker; the two team codes
# are the market endings.

# %%
data = pd.read_parquet(RAW / "kalshi_markets.parquet")
kg = data[data["league"] != "Fed"].copy()
kg["code"] = kg["ticker"].str.rsplit("-", n=1).str[-1].str.lower()          # e.g. "por"
d = kg["event_ticker"].str.extract(r"-(\d{2})([A-Z]{3})(\d{2})")
kg["date"] = pd.to_datetime("20" + d[0] + "-" + d[1].map(MONTHS).astype("Int64").astype(str).str.zfill(2) + "-" + d[2], errors="coerce").dt.date
kg = kg[kg["code"] != "tie"]                                                   # no tie markets in these four leagues, but be safe
doubleheader = kg["event_ticker"].str.contains(r"G[12]$", regex=True)       # Kalshi marks doubleheader games G1 and G2
print(int(kg.loc[doubleheader, "event_ticker"].nunique()), "doubleheader games dropped (the two platforms can't be lined up reliably)")
kg = kg[~doubleheader]
teams_per_event = kg.groupby("event_ticker")["code"].apply(lambda s: tuple(sorted(s)))
kg["teams"] = kg["event_ticker"].map(teams_per_event)
kg = kg[kg["teams"].map(len) == 2]
print(len(kg), "Kalshi team markets in", kg["event_ticker"].nunique(), "games")
kg[["ticker", "league", "date", "code", "teams", "result", "volume"]].head()

# %% [markdown]
# ### Polymarket games: date and team codes from the slug
# Slug `nba-phx-lal-2025-10-03` gives the league, the two team codes (in the same order as the outcomes) and the date.
# A doubleheader ends in `-2`, which I keep as part of the game id.

# %%
data = pd.read_parquet(RAW / "poly_markets.parquet")
pg = data[data["league"] != "Fed"].copy()
parts = pg["event_slug"].str.extract(r"^([a-z]+)-([a-z0-9]+)-([a-z0-9]+)-(\d{4}-\d{2}-\d{2})(?:-(\d+))?$")
pg["code_a"], pg["code_b"], pg["game_no"] = parts[1], parts[2], parts[4].fillna("1")
pg["date"] = pd.to_datetime(parts[3], errors="coerce").dt.date
pg = pg.dropna(subset=["code_a", "date"])
pg["outcomes_l"] = pg["outcomes"].map(lambda s: json.loads(s) if isinstance(s, str) else s)
pg["tokens_l"] = pg["token_ids"].map(lambda s: json.loads(s) if isinstance(s, str) else s)
pg["prices_l"] = pg["outcome_prices"].map(lambda s: json.loads(s) if isinstance(s, str) else s)
pg = pg[pg["tokens_l"].map(lambda t: isinstance(t, list) and len(t) == 2)]
print(len(pg), "Polymarket moneyline markets with two outcomes")
pg[["event_slug", "league", "date", "code_a", "code_b", "outcomes_l", "volume"]].head()

# %% [markdown]
# ### Do the team codes agree?
# Most codes are the same on both platforms. Where one platform uses a different code for the same team, it shows up as a
# game on the same day with one code in common and one code different. I count those and keep an alias only if it appears
# at least 3 times, always the same way.

# %%
def key(league, date, a, b):
    return (league, date, tuple(sorted((a, b))))

kalshi_games = kg.drop_duplicates("event_ticker")[["league", "date", "teams"]]
k_keys = {(r.league, r.date, r.teams) for r in kalshi_games.itertuples()}
p_keys = {key(r.league, r.date, r.code_a, r.code_b) for r in pg.itertuples()}
k_left = [k for k in k_keys if k not in p_keys]
p_left = [p for p in p_keys if p not in k_keys]
by_day = {}
for p in p_left:
    by_day.setdefault((p[0], p[1]), []).append(set(p[2]))
votes = {}
for lg, day, teams in k_left:
    for cand in by_day.get((lg, day), []):
        common = set(teams) & cand
        if len(common) == 1:
            k_only, p_only = (set(teams) - common).pop(), (cand - common).pop()
            votes.setdefault((lg, k_only), {}).setdefault(p_only, 0)
            votes[(lg, k_only)][p_only] += 1
aliases = {}
for (lg, k_code), opts in votes.items():
    best, n = max(opts.items(), key=lambda x: x[1])
    if n >= 3 and n == sum(opts.values()):
        aliases[(lg, k_code)] = best
pd.DataFrame([{"league": lg, "kalshi_code": k, "polymarket_code": p, "games": votes[(lg, k)][p]} for (lg, k), p in aliases.items()])

# %% [markdown]
# ### Match the games
# Kalshi codes are translated with the aliases, then matched on league, date and both teams.
# One pair per game: the Kalshi market for the team listed **first** on Polymarket, paired with that team's Polymarket outcome.

# %%
kg["code_p"] = [aliases.get((lg, c), c) for lg, c in zip(kg["league"], kg["code"])]
kg["teams_p"] = kg["event_ticker"].map(kg.groupby("event_ticker")["code_p"].apply(lambda s: tuple(sorted(s))))
pg["teams_p"] = [tuple(sorted((a, b))) for a, b in zip(pg["code_a"], pg["code_b"])]
pg = pg[pg["game_no"] == "1"]                                              # doubleheader second games: Kalshi tickers carry a time; skip to avoid mixing them up
merged = pg.merge(kg, left_on=["league", "date", "teams_p", "code_a"], right_on=["league", "date", "teams_p", "code_p"],
                  suffixes=("_p", "_k"))
games = pd.DataFrame({
    "category": merged["league"], "date": merged["date"],
    "kalshi_ticker": merged["ticker"], "kalshi_series": merged["series_ticker"],
    "kalshi_question": merged["title"] + " · yes = " + merged["yes_sub_title"].fillna(""),
    "poly_slug": merged["event_slug"], "poly_question": merged["question"] + " · yes = " + merged["outcomes_l"].str[0],
    "poly_token": merged["tokens_l"].str[0],
    "kalshi_result": (merged["result"] == "yes").astype(int),
    "poly_result": merged["prices_l"].map(lambda p: 1 if str(p[0]) in ("1", "1.0") else 0 if str(p[0]) in ("0", "0.0") else np.nan),
    "kalshi_volume": merged["volume_k"], "poly_volume": merged["volume_p"],
    "kalshi_open": merged["open_time"], "kalshi_close": merged["close_time"],
    "poly_close": pd.to_datetime(merged["closed_time"], utc=True, errors="coerce", format="mixed"),
})
games = games.drop_duplicates("kalshi_ticker")
print(len(games), "matched games;", games.groupby("category").size().to_dict())
games.head(3)

# %% [markdown]
# ### Fed decisions
# Kalshi codes each outcome: H0 = no change, C25 = cut 25, H25 = hike 25, C26 = cut more than 25, H26 = hike more than 25.
# Polymarket names them in words. Only outcomes with the same definition are paired. Polymarket's older "25+ bps increase"
# includes larger hikes, which Kalshi lists separately, so it is **not** paired.

# %%
kf = pd.read_parquet(RAW / "kalshi_markets.parquet")
kf = kf[kf["league"] == "Fed"].copy()
d = kf["event_ticker"].str.extract(r"-(\d{2})([A-Z]{3})$")
kf["meeting"] = "20" + d[0] + "-" + d[1].map(MONTHS).astype("Int64").astype(str).str.zfill(2)
kf["outcome"] = kf["ticker"].str.rsplit("-", n=1).str[-1].map({"H0": "no change", "C25": "cut 25", "H25": "hike 25", "C26": "cut 50+", "H26": "hike 50+"})

pf = pd.read_parquet(RAW / "poly_markets.parquet")
pf = pf[pf["league"] == "Fed"].copy()
FULL = {m: i + 1 for i, m in enumerate(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"])}
mm = pf["question"].str.lower().str.extract(r"(" + "|".join(FULL) + r") (\d{4}) meeting")
pf["meeting"] = mm[1] + "-" + mm[0].map(FULL).astype("Int64").astype(str).str.zfill(2)
pf["outcome"] = pf["group_title"].str.lower().str.strip().map({"no change": "no change", "25 bps decrease": "cut 25", "25 bps increase": "hike 25",
                                                                "50+ bps decrease": "cut 50+", "50+ bps increase": "hike 50+"})
pf["tokens_l"] = pf["token_ids"].map(lambda s: json.loads(s) if isinstance(s, str) else s)
pf["prices_l"] = pf["outcome_prices"].map(lambda s: json.loads(s) if isinstance(s, str) else s)
m = pf.dropna(subset=["meeting", "outcome"]).merge(kf.dropna(subset=["meeting", "outcome"]), on=["meeting", "outcome"], suffixes=("_p", "_k"))
fed = pd.DataFrame({
    "category": "Fed", "date": pd.to_datetime(m["close_time"]).dt.date,
    "kalshi_ticker": m["ticker"], "kalshi_series": m["series_ticker"],
    "kalshi_question": m["title"], "poly_slug": m["event_slug"], "poly_question": m["question"],
    "poly_token": m["tokens_l"].str[0],                                            # the "Yes" token
    "kalshi_result": (m["result"] == "yes").astype(int),
    "poly_result": m["prices_l"].map(lambda p: 1 if str(p[0]) in ("1", "1.0") else 0 if str(p[0]) in ("0", "0.0") else np.nan),
    "kalshi_volume": m["volume_k"], "poly_volume": m["volume_p"],
    "kalshi_open": m["open_time"], "kalshi_close": m["close_time"],
    "poly_close": pd.to_datetime(m["closed_time"], utc=True, errors="coerce", format="mixed"),
})
print(len(fed), "Fed outcome pairs over", m["meeting"].nunique(), "meetings")
fed[["date", "kalshi_question", "poly_question", "kalshi_result", "poly_result"]].head(6)

# %% [markdown]
# ### All pairs, and which are liquid
# A liquid pair has at least 1,000 traded on each platform. Pairs where the two platforms settled differently are kept and
# flagged: they are a finding, not an error to hide.

# %%
pairs = pd.concat([games, fed], ignore_index=True)
# Same event means the two markets closed close together. A big gap means a rescheduled game or a different event with the same label.
pairs["close_gap_hours"] = (pd.to_datetime(pairs["kalshi_close"], utc=True) - pairs["poly_close"]).abs().dt.total_seconds() / 3600
far = pairs["close_gap_hours"].isna() | (pairs["close_gap_hours"] > 24)
print(int(far.sum()), "pairs dropped because the two platforms closed more than 24 hours apart:", pairs[far].groupby("category").size().to_dict())
pairs = pairs[~far].reset_index(drop=True)
pairs["pair_id"] = np.arange(len(pairs))
pairs["liquid"] = (pairs["kalshi_volume"] >= MIN_VOLUME) & (pairs["poly_volume"] >= MIN_VOLUME)
pairs["settled_differently"] = pairs["poly_result"].notna() & (pairs["kalshi_result"] != pairs["poly_result"])
pairs.groupby("category").agg(pairs=("pair_id", "size"), liquid=("liquid", "sum"), settled_differently=("settled_differently", "sum"))

# %% [markdown]
# ### Choose the pairs whose prices I download
# Downloading every game's history would take many hours, so prices are fetched for **all liquid Fed pairs** and a
# **random 600 liquid games per league** (seed 42). The sample is drawn before any price is seen.

# %%
liquid = pairs[pairs["liquid"]]
sample = pd.concat([
    liquid[liquid["category"] == "Fed"],
    *[g.sample(min(600, len(g)), random_state=42) for c, g in liquid[liquid["category"] != "Fed"].groupby("category")],
])
pairs["in_sample"] = pairs["pair_id"].isin(sample["pair_id"])
print(int(pairs["in_sample"].sum()), "pairs to download prices for")

# %% [markdown]
# ### A sheet for checking matches by hand
# 25 random pairs per category (seed 7), showing both questions side by side. Each is checked by reading both questions and the
# two results; the verdicts are saved in `data/match_review.csv` and the precision is published.

# %%
review = pd.concat([g.sample(min(25, len(g)), random_state=7) for _, g in pairs.groupby("category")])
review = review[["pair_id", "category", "date", "kalshi_ticker", "kalshi_question", "poly_slug", "poly_question", "kalshi_result", "poly_result"]]
review.to_csv(OUT / "match_review_sheet.csv", index=False)
pairs.to_parquet(OUT / "pairs.parquet", index=False)
json.dump({f"{lg}:{k}": v for (lg, k), v in aliases.items()}, open(OUT / "team_code_aliases.json", "w"), indent=1)
print("saved pairs.parquet,", len(review), "pairs on the review sheet")
