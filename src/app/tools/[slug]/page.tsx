import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools } from "@/lib/tools";
import { Icon, ButtonLink } from "@/components/ui";
import { ThumbnailPreview } from "@/components/thumbnail-preview";
import { SafeZoneChecker } from "@/components/safe-zone-checker";
export const dynamicParams = false;
export function generateStaticParams() { return tools.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const tool = tools.find(t => t.slug === slug); return { title: tool?.name ?? "Tool not found", description: tool?.description }; }
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const tool = tools.find(t => t.slug === slug); if (!tool) notFound();
  if (slug === "youtube-thumbnail-preview") return <section className="container page-section"><Link href="/tools" className="back-link">← All creator tools</Link><span className="eyebrow">YOUTUBE · LOCAL IMAGE PREVIEW</span><h1>{tool.name}</h1><p className="page-intro">Try your thumbnail in context. Switch layouts, test a title, and compare two ideas side by side.</p><ThumbnailPreview/></section>;
  if (slug === "safe-zone-checker") return <section className="container page-section"><Link href="/tools" className="back-link">← All creator tools</Link><span className="eyebrow">SHORT-FORM VISUALS · LOCAL IMAGE PREVIEW</span><h1>{tool.name}</h1><p className="page-intro">Try illustrative obstruction overlays and position text or logo guides in a vertical canvas.</p><SafeZoneChecker/></section>;
  return <section className="container page-section tool-detail"><Link href="/tools" className="back-link">← All creator tools</Link><span className={`tool-icon ${tool.color}`}><Icon name={tool.icon}/></span><span className="eyebrow">{tool.category}</span><h1>{tool.name}</h1><p className="page-intro">{tool.description}</p><div className="placeholder-panel"><span className="pill"><span/> IN DEVELOPMENT</span><h2>A new part of your workflow is on its way.</h2><p>{tool.detail}</p><p>This is a foundation preview. Uploads, processing, previews of your own files, and downloads are not available yet.</p><button className="button button-disabled" disabled>Processing coming soon</button></div><ButtonLink href="/tools" secondary>Explore the other tools <Icon name="arrow"/></ButtonLink></section>;
}
