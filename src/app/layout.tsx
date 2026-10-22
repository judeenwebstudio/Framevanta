import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Framevanta — A little more creating", template: "%s | Framevanta" },
  description: "Try local thumbnail previews and illustrative safe-zone checks. Carousel, image resizing, and export tools are in development at Framevanta Creator Studio.",
  applicationName: "Framevanta Creator Studio", robots: { index: true, follow: true },
  openGraph: { title: "Framevanta Creator Studio", description: "A little less busywork. A little more creating.", type: "website", locale: "en_US" },
  twitter: { card: "summary", title: "Framevanta Creator Studio", description: "Five creator utilities, one thoughtful workspace. In development." },
};
export const viewport: Viewport = { themeColor: "#6D5EF5" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader/><main id="main-content">{children}</main><SiteFooter/></body></html>;
}
