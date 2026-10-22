import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage() { return <section className="container page-section prose-page"><span className="eyebrow">GET IN TOUCH</span><h1>A place for the conversation.</h1><p className="page-intro">We’re still setting up the studio, including our contact channels.</p><div className="placeholder-panel"><h2>Contact details coming before launch</h2><p>A verified support email and a way to send product feedback will be added here. This page does not collect or submit messages yet.</p></div><ButtonLink href="/tools" secondary>Back to the tools</ButtonLink></section>; }
