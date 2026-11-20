import type { Metadata, Viewport } from "next";
import "@fontsource-variable/host-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Nav from "@/components/Nav";
import Motion from "@/components/Motion";
import NextPage from "@/components/NextPage";
import { overview, snapshot, PORTFOLIO, LINKEDIN, GITHUB } from "@/lib/data";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE = "https://odds-gap.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image" },
  authors: [{ name: "Aditya Khetarpal", url: "https://www.linkedin.com/in/adityakhetarpal" }],
  title: { default: "OddsGap: same event, two prices (Kalshi vs Polymarket)", template: "%s · OddsGap" },
  description:
    "When Kalshi and Polymarket list the same yes/no question, how far apart are their prices, do the gaps close near the end, and which is more accurate? Thousands of matched NBA, NFL, MLB, NHL and Fed-decision markets, tested.",
  openGraph: { title: "OddsGap", description: "Same event, two prices: Kalshi vs Polymarket on thousands of identical questions.", url: SITE, siteName: "OddsGap", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0f1014" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Nav />
        <main id="main" tabIndex={-1}>{children}</main>
        <NextPage />
        <footer>
          <div className="wrap">
            <div>
              <p>Data: Kalshi and Polymarket public market-data APIs (no keys). {snapshot(overview.results.pre_registered)}</p>
              <p>Descriptive research only: not trading advice and not a trading signal. Not affiliated with Kalshi or Polymarket.</p>
            </div>
            <div className="links">
              <a href={PORTFOLIO}>Aditya Khetarpal: all projects ↗</a>
              <a href={LINKEDIN}>LinkedIn ↗</a>
              <a href={GITHUB}>Notebooks and data on GitHub ↗</a>
            </div>
          </div>
        </footer>
        <Motion />
        <SpeedInsights />
      </body>
    </html>
  );
}
