# OddsGap: design decisions

One question: **when Kalshi and Polymarket price the same yes/no question, how far apart are they?**
Readers: recruiters at fintech and trading firms (30 seconds), and traders who want the numbers (a few minutes).

## Current design: "The Split" (19 Nov 2026, redesigned from scratch)
Decided by Aditya: a new design from scratch, checked with the design-critique, design-council, ux-copy and review-animations skills.

**Idea.** Every result is one question split into two prices. Kalshi is the left half (orange), Polymarket the right half (blue),
and the gap between them is a hatched band. The same three parts carry the logo, the hero ticket, the chart band, the funnel and the accuracy scores.

- **Ive, material:** a split ticket. Two tinted halves with 14px outer corners, a hatched seam, display figures for the prices.
  Type (19 Nov 2026, from the taste skill's font deal for a fintech/software page, its first pick): Host Grotesk for headlines, prices
  and reading, JetBrains Mono for numbers in tables and readouts. Headlines at weight 500 with -4% tracking, text 400, buttons and labels 500.
- **Rams, restraint:** three type steps (display, title, body). Colour means something only: orange = Kalshi, blue = Polymarket,
  hatch = the gap, red = settled differently. Sentence case everywhere; no logos of either platform.
- **Hadid, flow:** hero (verdict and a real moment as a ticket) → one real pair, full width → the funnel (gap by time left, furthest first,
  centred on the seam so it narrows toward the close) → five questions on a results board → a dark closing statement. Inner pages end with a next-page link.
- **Ingels, delight that does a job:** on first load the two halves of the ticket slide together until only the gap is left; the pair chart's
  lines draw once. Both show the finding.
- **Norman, it teaches itself:** a legend names both colours in words on every chart; arrow keys read any chart; the phone nav uses
  short labels so all four pages fit; a designed 404 lists every page.
- **Mark (19 Nov 2026, Aditya's pick of three):** two overlapping circles, Kalshi orange and Polymarket blue; the shared area in ink is where
  the prices agree, and the two slivers left showing are the gap. Used in the header, favicon and share image.
- **Colour, validated:** Kalshi #e8542a / Polymarket #2f5bff (light) and #ea5a2f / #4f72ff (dark) pass the dataviz validator's colour-blind checks;
  text versions (#b23c17, #2446d6) pass 4.5:1 on white and on their tints.
- **Motion (review-animations standards):** ticket entrance 760ms ease-out, once; line draw 1.6s ease-in-out, once; buttons press to 0.97 in 160ms;
  hover only with a real pointer; Vanta (faint net) paused off screen and off on phones; reduced motion keeps short fades only.

## Earlier design (18 Nov 2026, replaced)

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
- 2026-11-19: fonts changed to Host Grotesk + JetBrains Mono (taste skill), replacing Bricolage Grotesque, Hanken Grotesk and Martian Mono.
- 2026-11-19: "The Split", a new design from scratch (above). Teal/violet, Archivo and IBM Plex Mono replaced.
- 2026-11-18: revision above.
- 2026-11-18: first design (design council).
