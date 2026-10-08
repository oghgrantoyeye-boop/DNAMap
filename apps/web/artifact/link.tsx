// Stand-in for next/link in the single-page build: routes become in-page anchors.
import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link({ href, children, ...rest }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const to = href === "/about/" ? "#about" : href === "/methodology/" ? "#methodology" : href === "/" ? "#map" : href;
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
