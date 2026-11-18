import type { Metadata, Viewport } from "next";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import Nav from "@/components/Nav";
import Motion from "@/components/Motion";

const SITE = "https://odds-gap.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "OddsGap: same event, two prices (Kalshi vs Polymarket)", template: "%s · OddsGap" },
  description:
    "When Kalshi and Polymarket list the same yes/no question, how far apart are their prices, do the gaps close near the end, and which is more accurate? Thousands of matched NBA, NFL, MLB, NHL and Fed-decision markets, tested.",
  openGraph: { title: "OddsGap", description: "Same event, two prices: Kalshi vs Polymarket on thousands of identical questions.", url: SITE, siteName: "OddsGap", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0b0d11" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>
          <div className="wrap">
            <span>Data: Kalshi and Polymarket public market-data APIs (no keys). Markets that closed 1 Jan 2025 to 31 Oct 2026.</span>
            <span>Descriptive research only: not trading advice and not a trading signal. Not affiliated with Kalshi or Polymarket.</span>
            <span>
              <a href="https://github.com/AdityaKhetarpal/oddsgap">Notebooks and data on GitHub</a> · built by{" "}
              <a href="https://www.linkedin.com/in/adityakhetarpal">Aditya Khetarpal</a>
            </span>
          </div>
        </footer>
        <Motion />
      </body>
    </html>
  );
}
