import Link from "next/link";
import type { Tool } from "@/lib/tools";
import { Icon } from "./ui";
export function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return <Link href={`/tools/${tool.slug}`} className="tool-card"><div className="tool-card-top"><span className={`tool-icon ${tool.color}`}><Icon name={tool.icon}/></span><span className="tool-number">0{index + 1}</span></div><span className="eyebrow tool-category">{tool.category}</span><h3>{tool.short}</h3><p>{tool.description}</p><div className="card-bottom"><span className="status"><span/>{(tool.slug === "youtube-thumbnail-preview" || tool.slug === "safe-zone-checker") ? "Try it free" : "Coming soon"}</span><Icon name="arrow"/></div></Link>;
}
