import ReactMarkdown from "react-markdown";

// Renders a Keystatic MDX/markdown body as long-form prose.
// MDX comments ({/* ... */}) are stripped before rendering.
export default function MarkdownBody({ children }: { children: string }) {
  const clean = children.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  return (
    <div className="prose-body max-w-none text-slate-800">
      <ReactMarkdown>{clean}</ReactMarkdown>
    </div>
  );
}
