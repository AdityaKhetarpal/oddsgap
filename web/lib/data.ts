import overviewJson from "@/public/data/overview.json";
import curveJson from "@/public/data/curve.json";
import explorerJson from "@/public/data/explorer.json";

export type Boot = { value: number; low: number; high: number; n: number; verdict?: string };
export type Pair = {
  id: number; category: string; date: string; kalshi_question: string; poly_question: string;
  outcome: number; gap_pp: number; series: [number, number, number][];
};
type Category = {
  category: string; pairs: number; gap_pp: number; low: number; high: number; share_over_2pp: number;
  kalshi_higher_pp: number; brier_kalshi: number | null; brier_polymarket: number | null; brier_pairs: number;
};
type Coverage = { category: string; matched: number; liquid: number; sampled: number; settled_differently: number; tested: number; reviewed: number; review_correct: number };

export const overview = overviewJson as unknown as {
  window: [string, string];
  results: {
    h1: Boot; h2: Boot & { far_median: number; near_median: number };
    h3: Boot & { brier_kalshi: number; brier_polymarket: number; better: string | null };
    lead: { same_step: number; kalshi_then_poly: number; poly_then_kalshi: number; steps: number };
    detail: { mean_gap_per_pair_median: number; mean_gap_all_points: number; identical_share: number; over_5pp_share: number };
    alignment: { best_shift: number; table: { shift_steps: number; points: number; mean_gap_pp: number }[] };
    pre_registered: string; pairs_tested: number; points: number;
    by_category: Category[];
    mismatches: { category: string; date: string; kalshi_ticker: string; poly_slug: string; kalshi_result: number; poly_result: number; close_gap_hours: number }[];
  };
  coverage: Coverage[];
  histogram: { from: number; to: number; pairs: number }[];
  aliases: Record<string, string>;
  hero: Pair;
};
export const curve = curveJson as { time_left: string; points: number; pairs: number; median_gap_pp: number; mean_gap_pp: number; p75_gap_pp: number }[];
export const explorer = explorerJson as unknown as Pair[];

export const CATEGORY_NAME: Record<string, string> = { NBA: "NBA games", NFL: "NFL games", MLB: "MLB games", NHL: "NHL games", Fed: "Fed rate decisions" };
export const num = (v: number) => Math.round(v).toLocaleString("en-US");
export const pp = (v: number, d = 1) => `${v.toFixed(d)} pts`;
export const signed = (v: number, d = 2) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`;
export const dateName = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const totals = () => {
  const c = overview.coverage;
  const sum = (k: keyof Coverage) => c.reduce((s, r) => s + (r[k] as number), 0);
  return { matched: sum("matched"), liquid: sum("liquid"), sampled: sum("sampled"), tested: sum("tested"),
           reviewed: sum("reviewed"), correct: sum("review_correct"), different: sum("settled_differently") };
};
