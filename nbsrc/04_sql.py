# %% [markdown]
# # 04 · Line up the two prices in SQL
# Each table is loaded into `data`, written to DuckDB, then joined in SQL. The result is the set of **comparable points**:
# times when both platforms have a price for the same pair, as fixed in the plan.

# %%
from pathlib import Path
import pandas as pd
import duckdb

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
con = duckdb.connect(str(OUT / "oddsgap.duckdb"))      # local database, rebuilt each run (not committed)

# %% [markdown]
# ### Load the pairs

# %%
data = pd.read_parquet(OUT / "pairs.parquet")
data["kalshi_close"] = pd.to_datetime(data["kalshi_close"], utc=True)
data["poly_close"] = pd.to_datetime(data["poly_close"], utc=True)
con.execute("CREATE OR REPLACE TABLE pairs AS SELECT * FROM data")
data[["pair_id", "category", "kalshi_question", "poly_question", "liquid", "in_sample"]].head(3)

# %% [markdown]
# ### Load the prices

# %%
data = pd.read_parquet(OUT / "prices.parquet")
con.execute("CREATE OR REPLACE TABLE prices AS SELECT * FROM data")
data.groupby("platform").size()

# %% [markdown]
# ### Comparable points
# A comparable point is a 3-hour grid time when:
# - both platforms have a price for the pair,
# - both prices are between 3% and 97%,
# - and the time is at least 3 hours before the earlier of the two close times.
#
# `gap_pp` is the absolute difference in percentage points; `diff_pp` keeps the sign (positive = Kalshi higher).

# %%
con.execute("""
CREATE OR REPLACE VIEW comparable AS
SELECT p.pair_id,
       p.category,
       k.ts,
       k.price                                                   AS kalshi,
       m.price                                                   AS polymarket,
       100 * ABS(k.price - m.price)                              AS gap_pp,
       100 * (k.price - m.price)                                 AS diff_pp,
       (EPOCH(LEAST(p.kalshi_close, p.poly_close)) - k.ts) / 3600.0 AS hours_to_close,
       p.kalshi_result                                           AS outcome,
       p.settled_differently
FROM prices k
JOIN prices m ON m.pair_id = k.pair_id AND m.ts = k.ts AND m.platform = 'polymarket'
JOIN pairs  p ON p.pair_id = k.pair_id
WHERE k.platform = 'kalshi'
  AND p.liquid AND p.in_sample
  AND k.price BETWEEN 0.03 AND 0.97
  AND m.price BETWEEN 0.03 AND 0.97
  AND k.ts <= EPOCH(LEAST(p.kalshi_close, p.poly_close)) - 3 * 3600
""")
data = con.execute("SELECT COUNT(*) AS points, COUNT(DISTINCT pair_id) AS pairs FROM comparable").df()
data

# %% [markdown]
# ### One gap per pair
# The pair gap is the median of its comparable points. A pair needs at least 4 comparable points.

# %%
con.execute("""
CREATE OR REPLACE VIEW pair_gaps AS
SELECT pair_id, category,
       COUNT(*)                     AS points,
       MEDIAN(gap_pp)               AS gap_pp,
       MEDIAN(diff_pp)              AS diff_pp
FROM comparable
GROUP BY pair_id, category
HAVING COUNT(*) >= 4
""")
data = con.execute("""
SELECT category, COUNT(*) AS pairs, ROUND(MEDIAN(gap_pp), 2) AS median_gap_pp, ROUND(AVG(points), 1) AS avg_points
FROM pair_gaps GROUP BY category ORDER BY pairs DESC
""").df()
data

# %% [markdown]
# ### The gap by time left before the close
# Every comparable point, grouped by how many hours were left. This is the shape of the curve on the website.

# %%
data = con.execute("""
SELECT CASE WHEN hours_to_close < 6 THEN '3–6 h'
            WHEN hours_to_close < 12 THEN '6–12 h'
            WHEN hours_to_close < 24 THEN '12–24 h'
            WHEN hours_to_close < 48 THEN '1–2 days'
            WHEN hours_to_close < 72 THEN '2–3 days'
            WHEN hours_to_close < 168 THEN '3–7 days'
            ELSE 'over a week' END                         AS time_left,
       MIN(hours_to_close)                                 AS sort_key,
       COUNT(*)                                            AS points,
       COUNT(DISTINCT pair_id)                             AS pairs,
       MEDIAN(gap_pp)                                      AS median_gap_pp,
       AVG(gap_pp)                                         AS mean_gap_pp,
       QUANTILE_CONT(gap_pp, 0.75)                         AS p75_gap_pp
FROM comparable
WHERE pair_id IN (SELECT pair_id FROM pair_gaps)
GROUP BY 1 ORDER BY sort_key
""").df()
data

# %% [markdown]
# ### Save the tables for the analysis

# %%
con.execute("SELECT * FROM comparable WHERE pair_id IN (SELECT pair_id FROM pair_gaps)").df().to_parquet(OUT / "comparable.parquet", index=False)
con.execute("SELECT * FROM pair_gaps").df().to_parquet(OUT / "pair_gaps.parquet", index=False)
data.to_parquet(OUT / "gap_curve.parquet", index=False)
con.close()
print("saved comparable, pair_gaps and gap_curve")
