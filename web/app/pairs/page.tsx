import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { explorer } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/pairs" },
  title: "Explore pairs",
  description: "Pick any of the most-traded matched questions and compare the Kalshi and Polymarket prices over time.",
};

export default function Pairs() {
  return (
    <div className="wrap">
      <div className="head">
        <h1>Explore the pairs</h1>
        <p>
          Here are the {explorer.length} most-traded pairs. Each one is a question listed on both platforms. The two lines are Kalshi&apos;s and Polymarket&apos;s price for the same &ldquo;yes&rdquo;,
          every 3 hours until 3 hours before the close. Where the hatched band between them is wide, the two markets disagreed.
        </p>
      </div>
      <Explorer pairs={explorer} />
      <p className="source" style={{ marginTop: 16 }}>
        Kalshi price: bid-ask midpoint when both sides were quoted, otherwise the last trade. Polymarket price: its 3-hour price series.
        Source: both platforms&apos; public APIs.
      </p>
    </div>
  );
}
