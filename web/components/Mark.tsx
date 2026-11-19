// The OddsGap mark: one ticket split in two, Kalshi's half and Polymarket's half, with the gap between them.
export default function Mark() {
  return (
    <svg viewBox="0 0 28 20" aria-hidden="true">
      <rect x="0" y="0" width="11.5" height="20" rx="4" fill="var(--kalshi)" />
      <rect x="16.5" y="0" width="11.5" height="20" rx="4" fill="var(--poly)" />
      <path d="M13 3 L15 1 M13 8 L15 6 M13 13 L15 11 M13 18 L15 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
