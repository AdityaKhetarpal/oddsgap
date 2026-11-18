"use client";
import { useMemo, useState } from "react";
import PairChart from "./PairChart";
import type { Pair } from "@/lib/data";

const NAMES: Record<string, string> = { NBA: "NBA", NFL: "NFL", MLB: "MLB", NHL: "NHL", Fed: "Fed decisions" };
const day = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Pick a category, then a pair, and see its two price lines. */
export default function Explorer({ pairs }: { pairs: Pair[] }) {
  const cats = useMemo(() => [...new Set(pairs.map((p) => p.category))], [pairs]);
  const [cat, setCat] = useState(cats[0]);
  const list = pairs.filter((p) => p.category === cat);
  const [id, setId] = useState<number>(list[0]?.id);
  const pair = pairs.find((p) => p.id === id && p.category === cat) ?? list[0];

  return (
    <div>
      <div className="pick" role="group" aria-label="Category">
        {cats.map((c) => (
          <button key={c} type="button" aria-pressed={c === cat} onClick={() => { setCat(c); setId(pairs.find((p) => p.category === c)!.id); }}>{NAMES[c] ?? c}</button>
        ))}
      </div>
      <label className="small" htmlFor="pair">Pair ({list.length} most-traded in this category)</label>
      <select id="pair" value={pair?.id} onChange={(e) => setId(Number(e.target.value))}>
        {list.map((p) => (
          <option key={p.id} value={p.id}>{day(p.date)} · {p.poly_question.split(" · ")[0]} · gap {p.gap_pp.toFixed(1)} pts</option>
        ))}
      </select>
      {pair && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="qpair">
            <div className="qk"><span className="k">Kalshi:</span> {pair.kalshi_question}</div>
            <div className="qp"><span className="p">Polymarket:</span> {pair.poly_question}</div>
          </div>
          <p className="small" style={{ marginTop: 8 }}>
            Settled <b>{pair.outcome ? "yes" : "no"}</b> on both · median gap <b>{pair.gap_pp.toFixed(2)} pts</b> over {pair.series.length} comparable 3-hour points
          </p>
          <PairChart key={pair.id} series={pair.series} />
        </div>
      )}
    </div>
  );
}
