import Link from "next/link";
export function SiteFooter() {
  return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Link className="brand" href="/">framevanta<span className="brand-dot">.</span></Link><p>A little less busywork.<br/>A little more creating.</p></div><nav aria-label="Footer navigation"><Link href="/tools">All tools</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Framevanta. Provisional brand.</span><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/cookies">Cookies</Link></div><span>Made for your next idea.</span></div></div></footer>;
}
