# OddsGap: design decisions (design council, 18 Nov 2026)

One question: **when Kalshi and Polymarket price the same yes/no question, how far apart are they?**
Readers: recruiters at fintech and trading firms (30 seconds), and traders who want the numbers (a few minutes).

## Hadid: movement through space
- **The opening screen is the answer.** It gives the median gap in one big number ("2.4 points" style) and a sentence verdict.
  Beneath it sit **two lines that converge**: one real matched pair's Kalshi and Polymarket prices.
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
- The material is a **price tape**: two thin lines, exact numbers, tabular figures.
- Two themes from the same tokens: paper-white and ink-dark.
- Corner radius 4px, sharper than SIP Pulse's 6px, because this is a market screen.

## Rams: restraint
- Three type sizes: display, title and body. Charts and captions use 14px.
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
- Hover or tap a time on any chart to read both prices and the gap. A hint under the chart says so once.
- "Points" are explained on first use ("percentage points: 52% vs 49% is a 3-point gap").
- Phone first: charts redraw at their box's width; tables scroll inside their own box.

## Tension, resolved
**Rams vs Ingels:** the only animation that stays is the converging pair of lines, because it shows the finding.
