# %% [markdown]
# # 06 · Export small JSON files for the website
# Every number on the website comes from these files.

# %%
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
WEB = ROOT / "web" / "public" / "data"
WEB.mkdir(parents=True, exist_ok=True)
results = json.loads((OUT / "results.json").read_text())
pairs = pd.read_parquet(OUT / "pairs.parquet")
comp = pd.read_parquet(OUT / "comparable.parquet")
gaps = pd.read_parquet(OUT / "pair_gaps.parquet")

def save(name, obj):
    path = WEB / f"{name}.json"
    path.write_text(json.dumps(obj, separators=(",", ":"), default=lambda x: None if pd.isna(x) else float(x)))
    print(f"{name}.json {path.stat().st_size / 1024:.1f} KB")

# %% [markdown]
# ### Coverage: how many pairs at each step

# %%
data = pairs.groupby("category").agg(matched=("pair_id", "size"), liquid=("liquid", "sum"), sampled=("in_sample", "sum"),
                                     settled_differently=("settled_differently", "sum")).reset_index()
data["tested"] = data["category"].map(gaps.groupby("category").size()).fillna(0).astype(int)
review = pd.read_csv(OUT / "match_review.csv")
data["reviewed"] = data["category"].map(review.groupby("category").size()).fillna(0).astype(int)
data["review_correct"] = data["category"].map(review.groupby("category")["same_question"].sum()).fillna(0).astype(int)
coverage = data
coverage

# %% [markdown]
# ### The gap curve

# %%
curve = pd.read_parquet(OUT / "gap_curve.parquet")
curve

# %% [markdown]
# ### Pairs for the explorer
# Up to 12 per category: the most-traded pairs (both platforms' volume added) with at least 8 comparable points.

# %%
pts = comp.groupby("pair_id").size()
data = pairs[pairs["pair_id"].isin(pts[pts >= 8].index)].copy()
data["traded"] = data["kalshi_volume"] + data["poly_volume"]
pick = data.sort_values("traded", ascending=False).groupby("category").head(12)
explorer = []
for r in pick.itertuples():
    s = comp[comp["pair_id"] == r.pair_id].sort_values("ts")
    explorer.append({
        "id": int(r.pair_id), "category": r.category, "date": str(r.date),
        "kalshi_question": r.kalshi_question, "poly_question": r.poly_question,
        "outcome": int(r.kalshi_result), "gap_pp": float(gaps.set_index("pair_id").loc[r.pair_id, "gap_pp"]),
        "series": [[int(t), round(float(k), 4), round(float(p), 4)] for t, k, p in zip(s["ts"], s["kalshi"], s["polymarket"])],
    })
print(len(explorer), "pairs for the explorer")

# %% [markdown]
# ### The pair on the opening screen
# Chosen by a fixed rule: among explorer pairs with at least 16 points, the one whose gap is closest to the overall median.

# %%
median_gap = results["h1"]["value"]
cands = [e for e in explorer if len(e["series"]) >= 16] or explorer
hero = min(cands, key=lambda e: abs(e["gap_pp"] - median_gap))
print(hero["kalshi_question"], "·", hero["gap_pp"])

# %% [markdown]
# ### Distribution of pair gaps (for a histogram)

# %%
edges = [0, 0.5, 1, 1.5, 2, 3, 4, 6, 10, 100]
hist = pd.cut(gaps["gap_pp"], edges, right=False).value_counts().sort_index()
histogram = [{"from": float(i.left), "to": float(i.right), "pairs": int(v)} for i, v in hist.items()]
histogram

# %% [markdown]
# ### Save everything

# %%
aliases = json.loads((OUT / "team_code_aliases.json").read_text())
save("overview", {"results": results, "coverage": coverage.to_dict("records"), "histogram": histogram,
                  "aliases": aliases, "hero": hero, "window": ["2025-01-01", "2026-10-31"]})
save("curve", curve.drop(columns=["sort_key"]).to_dict("records"))
save("explorer", explorer)
for f in WEB.glob("*.json"):
    assert f.stat().st_size < 1_000_000, f.name
print("all files under 1 MB")
