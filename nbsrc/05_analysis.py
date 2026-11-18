# %% [markdown]
# # 05 · Test the pre-registered hypotheses
# Locked on 18 November 2026, before any market data was downloaded (`input/ideas/oddsgap-plan.md`).
# - **H1:** the median pair gap is at least 2 percentage points.
# - **H2:** gaps are smaller in the last 24 hours than more than 72 hours out.
# - **H3:** neither platform is more accurate (Brier score) 24 hours before the close.

# %%
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
comp = pd.read_parquet(OUT / "comparable.parquet")
gaps = pd.read_parquet(OUT / "pair_gaps.parquet")
print(len(gaps), "pairs ·", len(comp), "comparable points")

# %% [markdown]
# ### The bootstrap
# Resample the pairs 10,000 times (seed 42) and keep the middle 90% of the statistic.

# %%
def boot(values, stat=np.median, n=10_000, seed=42):
    v = np.asarray(values, float)
    rng = np.random.default_rng(seed)
    sims = stat(rng.choice(v, (n, len(v))), axis=1)
    lo, hi = np.percentile(sims, [5, 95])
    return {"value": float(stat(v)), "low": float(lo), "high": float(hi), "n": int(len(v))}

# %% [markdown]
# ### H1: how far apart are the two prices?

# %%
h1 = boot(gaps["gap_pp"])
h1["verdict"] = "supported" if h1["low"] >= 2 else "rejected" if h1["high"] < 2 else "inconclusive"
print(f"median pair gap {h1['value']:.2f} pp (90% range {h1['low']:.2f}–{h1['high']:.2f}) over {h1['n']} pairs → H1 {h1['verdict']}")

# %% [markdown]
# ### H2: do gaps close near the end?
# For pairs with points both more than 72 hours out and in the final 24 hours: far gap minus near gap.

# %%
far = comp[comp["hours_to_close"] > 72].groupby("pair_id")["gap_pp"].median()
near = comp[comp["hours_to_close"] <= 24].groupby("pair_id")["gap_pp"].median()
both = pd.concat([far.rename("far"), near.rename("near")], axis=1).dropna()
h2 = boot(both["far"] - both["near"])
h2.update({"far_median": float(both["far"].median()), "near_median": float(both["near"].median())})
h2["verdict"] = "supported" if h2["low"] > 0 else "rejected"
print(f"{h2['n']} pairs: far {h2['far_median']:.2f} pp → near {h2['near_median']:.2f} pp; change {h2['value']:.2f} "
      f"(90% range {h2['low']:.2f}–{h2['high']:.2f}) → H2 {h2['verdict']}")

# %% [markdown]
# ### H3: which platform was more accurate?
# For each pair: the last comparable point at least 24 hours before the close. Brier score = (price − outcome)², lower is better.
# Pairs that settled differently on the two platforms are left out (the "outcome" isn't one thing there).

# %%
early = comp[(comp["hours_to_close"] >= 24) & (~comp["settled_differently"])].sort_values("ts").groupby("pair_id").tail(1)
early = early.assign(brier_k=(early["kalshi"] - early["outcome"]) ** 2, brier_p=(early["polymarket"] - early["outcome"]) ** 2)
h3 = boot(early["brier_k"] - early["brier_p"], stat=np.mean)
h3.update({"brier_kalshi": float(early["brier_k"].mean()), "brier_polymarket": float(early["brier_p"].mean())})
h3["verdict"] = "rejected" if (h3["low"] > 0 or h3["high"] < 0) else "supported"
h3["better"] = None if h3["verdict"] == "supported" else ("polymarket" if h3["value"] > 0 else "kalshi")
print(f"{h3['n']} pairs: Brier Kalshi {h3['brier_kalshi']:.4f}, Polymarket {h3['brier_polymarket']:.4f}; "
      f"difference {h3['value']:.4f} (90% range {h3['low']:.4f}–{h3['high']:.4f}) → H3 {h3['verdict']}")

# %% [markdown]
# ### Reported, not deciding: by category

# %%
by_cat = []
for c, g in gaps.groupby("category"):
    b = boot(g["gap_pp"])
    e = early[early["category"] == c]
    by_cat.append({"category": c, "pairs": int(len(g)), "gap_pp": b["value"], "low": b["low"], "high": b["high"],
                   "share_over_2pp": float((g["gap_pp"] >= 2).mean() * 100), "kalshi_higher_pp": float(g["diff_pp"].median()),
                   "brier_kalshi": float(e["brier_k"].mean()) if len(e) else None,
                   "brier_polymarket": float(e["brier_p"].mean()) if len(e) else None, "brier_pairs": int(len(e))})
by_cat = pd.DataFrame(by_cat).sort_values("pairs", ascending=False)
by_cat.round(3)

# %% [markdown]
# ### Reported, not deciding: who moves first?
# Within each pair, take each platform's 3-hour price change between consecutive grid times. If Kalshi's change today
# predicts Polymarket's change at the next step better than the other way round, Kalshi tends to move first.

# %%
c = comp.sort_values(["pair_id", "ts"]).copy()
c["dk"] = c.groupby("pair_id")["kalshi"].diff()
c["dp"] = c.groupby("pair_id")["polymarket"].diff()
c["dk_next"] = c.groupby("pair_id")["dk"].shift(-1)
c["dp_next"] = c.groupby("pair_id")["dp"].shift(-1)
c["step_ok"] = c.groupby("pair_id")["ts"].diff() == 10800          # only consecutive 3-hour steps
ok = c[c["step_ok"] & c.groupby("pair_id")["step_ok"].shift(-1).fillna(False).astype(bool)].dropna(subset=["dk", "dp", "dk_next", "dp_next"])
lead = {
    "same_step": float(ok["dk"].corr(ok["dp"])),
    "kalshi_then_poly": float(ok["dk"].corr(ok["dp_next"])),
    "poly_then_kalshi": float(ok["dp"].corr(ok["dk_next"])),
    "steps": int(len(ok)),
}
lead

# %% [markdown]
# ### Reported, not deciding: pairs that settled differently

# %%
pairs = pd.read_parquet(OUT / "pairs.parquet")
mismatch = pairs[pairs["settled_differently"]][["category", "date", "kalshi_ticker", "poly_slug", "kalshi_result", "poly_result", "close_gap_hours"]]
mismatch

# %% [markdown]
# ### Save

# %%
results = {"h1": h1, "h2": h2, "h3": h3, "lead": lead, "pre_registered": "2026-11-18",
           "pairs_tested": int(len(gaps)), "points": int(len(comp)),
           "by_category": by_cat.to_dict("records"),
           "mismatches": mismatch.assign(date=mismatch["date"].astype(str)).to_dict("records")}
(OUT / "results.json").write_text(json.dumps(results, indent=1, default=float))
print(json.dumps({k: results[k] for k in ("h1", "h2", "h3")}, indent=1))
