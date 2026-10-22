"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container header-inner">
    <Link href="/" className="brand" aria-label="Framevanta home"><span className="brand-mark" aria-hidden="true">f</span>framevanta<span className="brand-dot">.</span></Link>
    <button className="menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
    <nav id="main-nav" aria-label="Main navigation" className={open ? "navigation is-open" : "navigation"}>{[["/tools", "Tools"], ["/pricing", "Pricing"], ["/about", "About"]].map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/tools" className="button button-dark" onClick={() => setOpen(false)}>Explore tools <span aria-hidden="true">↗</span></Link></nav>
  </div></header>;
}
