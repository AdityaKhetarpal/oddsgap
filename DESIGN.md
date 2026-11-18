# OddsGap: design decisions (design council, 18 Nov 2026)

One question: **when Kalshi and Polymarket price the same yes/no question, how far apart are they?**
Readers: recruiters at fintech and trading firms (30 seconds), and traders who want the numbers (a few minutes).

## Hadid: movement through space
- **The opening screen is the answer.** The verdict is the headline itself ("a typical gap of 0.75 points"), set extra-wide.
  Beside the short explanation sit **two lines that converge**: one real matched pair's Kalshi and Polymarket prices. No stat strip.
- **Rooms, in order:**
  1. The answer.
  2. How the gap shrinks as the close nears: one chart of the gap against hours before close.
  3. Which platform was right more often: Brier scores with ranges.
  4. Who moves first.
- **Other pages:**
  - Pair explorer: pick any pair and see its two lines.
  - By category: games by league, and Fed decisions.
  - Method.

## Ive: material
- The material is an **odds board**: two thin lines, exact numbers, tabular figures, ruled rows.
- Type: **Archivo** throughout, extra-wide (115–122%) for headlines, answers and prices, normal width for reading.
- Two themes from the same tokens: paper-white and ink-dark.
- Corner radius 4px, sharper than SIP Pulse's 6px, because this is a market screen.

## Rams: restraint
- Three type sizes: display, title and body. Charts and captions use 14–14.5px.
- Labels are sentence case. No all-caps tags, no eyebrow lines, no "A · B · C" strings, no arrows on links.
- Colour carries meaning only:
  - **Kalshi is one fixed colour (teal) and Polymarket another (violet)**, everywhere: lines, labels and tables. No other hues.
  - Grey marks the gap between the two lines.
  - Red is used only for pairs that settled differently.
- No logos of either platform (we don't imply endorsement), no badges, no gradient blobs.

## Ingels: delight that does a job
- **The closing gap.** On load, the two opening lines draw from left to right and meet at the settle point. The shaded gap
  between them narrows as they go. It is the brand ("OddsGap") *and* the main finding.
- Vanta (very faint, "net") sits behind the opening screen only: many traders, one price. It is off on phones and with reduced motion.
- Lenis gives smooth scrolling between rooms.

## Norman: it teaches itself
- A legend names the two colours once, at the top of every chart, in words ("Kalshi", "Polymarket").
- Hover, tap, or focus a chart and use the arrow keys to read both prices and the gap. A hint under the chart says so once.
- "Points" are explained on first use ("percentage points: 52% vs 49% is a 3-point gap").
- Phone first: charts redraw at their box's width; tables scroll inside their own box.

## Tension, resolved
**Rams vs Ingels:** the only animation that stays is the converging pair of lines, because it shows the finding.

## Revision, 18 Nov 2026 (decision record)
Decided by Aditya: enhance the live site with the frontend-design, design-council, design-critique, design-review,
accessibility-review, portfolio-audit and portfolio-story skills. What changed and why:
- **Type:** IBM Plex Sans replaced by Archivo with its width axis, so the two sites no longer share a typeface.
- **Opening screen:** the headline spans the page; the four-number stat strip is gone and its figures moved into the text and answers.
- **Answers:** five cards (three locked tests, two reported checks) became one set of ruled rows, with the status in its own column.
- **Motion:** one moment only, the two lines drawing themselves. The scroll fade-ups were removed. Lenis and Vanta stay.
- **Accessibility (WCAG 2.1 AA):** charts take keyboard focus and arrow keys; the pair picker no longer overflows a phone screen;
  sideways-scrolling tables are focusable; buttons are at least 44px tall; axe-core reports no violations in light or dark mode.
- **Search:** sitemap, robots, canonical URLs, a Twitter card and Dataset JSON-LD on the home page.
- Not changed: Kalshi teal and Polymarket violet, the mark, the data and every verdict.

## Change log
- 2026-11-18: revision above.
- 2026-11-18: first design (design council).
