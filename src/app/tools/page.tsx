import type { Metadata } from "next";
import { tools } from "@/lib/tools";
import { ToolCard } from "@/components/tool-card";
export const metadata: Metadata = { title: "Creator tools", description: "Try local thumbnail previews and illustrative safe-zone checks; explore three more creator tools in development." };
export default function ToolsPage() { return <section className="container page-section"><span className="eyebrow">YOUR CREATOR TOOLKIT</span><h1>One idea. So many possibilities.</h1><p className="page-intro">Try Thumbnail Preview and Safe Zone Checker for free, or explore the three tools still in development.</p><div className="tools-grid directory-grid">{tools.map((tool, index) => <ToolCard key={tool.slug} tool={tool} index={index}/>)}</div></section>; }
