import Link from "next/link";
import type { Metadata } from "next";
import { LINKS } from "@/lib/links";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="head">
        <h1>No market lists this page.</h1>
        <p>The link may be old or mistyped. These are the four pages on the site.</p>
      </div>
      <div className="board">
        {LINKS.map(([href, label, , question], i) => (
          <div key={href} className="result">
            <span className="tag">Page {i + 1}</span>
            <h3 className="q"><Link href={href}>{label}</Link></h3>
            <p className="small">{question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
