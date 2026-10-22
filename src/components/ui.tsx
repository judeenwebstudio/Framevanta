import Link from "next/link";
import type { ReactNode } from "react";
export function ButtonLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link className={`button ${secondary ? "button-secondary" : "button-primary"}`} href={href}>{children}</Link>;
}
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    play: <><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/></>,
    frame: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="6" width="10" height="12" rx="2"/></>,
    carousel: <><rect x="7" y="4" width="10" height="16" rx="2"/><path d="M3 7v10M21 7v10m-10-5h2"/></>,
    resize: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 16 8-8m-5 0h5v5"/></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg aria-hidden="true" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.frame}</svg>;
}
