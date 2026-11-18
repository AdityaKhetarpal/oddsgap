"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Mark from "./Mark";

const LINKS = [
  ["/", "The answer"],
  ["/pairs", "Explore pairs"],
  ["/categories", "By category"],
  ["/method", "How we tested it"],
] as const;

export default function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="OddsGap home"><Mark />OddsGap</Link>
        <nav className="nav" aria-label="Pages">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
