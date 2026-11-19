"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Mark from "./Mark";
import { LINKS } from "@/lib/links";

// Four pages. On phones the labels shorten so all four fit on one line, with nothing scrolled out of sight.
export default function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="OddsGap home"><Mark /><span>OddsGap</span></Link>
        <nav className="nav" aria-label="Pages">
          {LINKS.map(([href, label, short]) => (
            <Link key={href} href={href} aria-label={label} aria-current={path === href ? "page" : undefined}>
              <span className="long">{label}</span><span className="short">{short}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
