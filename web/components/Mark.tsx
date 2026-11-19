// The OddsGap mark: two overlapping circles, Kalshi (orange) and Polymarket (blue).
// The shared area, in ink, is where the two prices agree: most of it. The slivers left showing are the gap.
export default function Mark() {
  return (
    <svg viewBox="0 0 30 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9.5" fill="var(--kalshi)" />
      <circle cx="20" cy="10" r="9.5" fill="var(--poly)" />
      <path d="M15 1.922 A9.5 9.5 0 0 1 15 18.078 A9.5 9.5 0 0 1 15 1.922 Z" fill="currentColor" />
    </svg>
  );
}
