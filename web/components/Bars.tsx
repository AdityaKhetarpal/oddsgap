/** Horizontal bars in HTML, so labels stay readable at any screen width. */
export default function Bars({ rows, unit = "", label }: { rows: { label: string; value: number }[]; unit?: string; label: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <div className="hbars" role="img" aria-label={label}>
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <span className="hl">{r.label}</span>
          <span className="ht"><span className="hf" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="hv">{r.value.toFixed(2)}{unit}</span>
        </div>
      ))}
    </div>
  );
}
