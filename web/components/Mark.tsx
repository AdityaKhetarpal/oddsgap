// The OddsGap mark: two price lines that start apart and meet.
export default function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 10 C13 11 18 16 26 16" fill="none" stroke="var(--kalshi)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 22 C13 21 18 16 26 16" fill="none" stroke="var(--poly)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
