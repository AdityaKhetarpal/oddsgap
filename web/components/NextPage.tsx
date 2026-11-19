"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LINKS } from "@/lib/links";

// At the end of every inner page: the next page in order, so no page is a dead end.
// The home page ends with its own closing section, so it shows nothing here.
export default function NextPage() {
  const path = usePathname();
  const i = LINKS.findIndex(([href]) => href === path);
  if (i <= 0) return null;
  const n = (i + 1) % LINKS.length;
  const [href, label, , question] = LINKS[n];
  return (
    <section className="next">
      <div className="wrap">
        <Link href={href}>
          <span className="nl">{n === 0 ? "Back to the start" : `Next: page ${n + 1} of ${LINKS.length}`}</span>
          <span className="t">{label} <span className="go" aria-hidden="true">→</span></span>
          <span className="d">{question}</span>
        </Link>
      </div>
    </section>
  );
}
