/** Horizontal bars in HTML, so labels stay readable at any screen width. The highlighted row is solid; the rest are hatched like the gap. */
export default function Bars({ rows, unit = "", label, highlight }: { rows: { label: string; value: number }[]; unit?: string; label: string; highlight?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <div className="hbars" role="img" aria-label={label}>
      {rows.map((r) => (
        <div key={r.label} className={`hbar${r.label === highlight ? " hi" : ""}`}>
          <span className="hl">{r.label}</span>
          <span className="ht"><span className="hf" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="hv">{r.value.toFixed(unit === "%" ? 0 : 2)}{unit}</span>
        </div>
      ))}
    </div>
  );
}
