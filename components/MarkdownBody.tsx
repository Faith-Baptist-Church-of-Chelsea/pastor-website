import ReactMarkdown from "react-markdown";
import { linkScripture } from "@/lib/bible";

// Renders a Keystatic MDX/markdown body as long-form prose.
// MDX comments ({/* ... */}) are stripped, and bare scripture references
// ("Ephesians 5:19") become KJV BibleGateway links that open in a new tab.
export default function MarkdownBody({ children }: { children: string }) {
  const clean = linkScripture(children.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""));
  return (
    <div className="prose-body max-w-none text-slate-800">
      <ReactMarkdown
        components={{
          a: ({ href, children: kids }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {kids}
              </a>
            );
          },
        }}
      >
        {clean}
      </ReactMarkdown>
    </div>
  );
}
