import { bibleGatewayUrl } from "@/lib/bible";

// A passage string ("Ephesians 5:19, Colossians 3:16") with each reference
// linked to BibleGateway (KJV) in a new tab.
export default function ScriptureRef({ refText }: { refText: string }) {
  const parts = refText.split(/,\s*/);
  return (
    <span className="font-medium">
      {parts.map((p, i) => (
        <span key={p + i}>
          {i > 0 && ", "}
          <a
            href={bibleGatewayUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline decoration-dotted underline-offset-2 hover:text-brand-600"
          >
            {p}
          </a>
        </span>
      ))}
    </span>
  );
}
