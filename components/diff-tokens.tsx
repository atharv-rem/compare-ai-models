import { DisplayPart } from "@/lib/markdown-diff";

function joinTokens(tokens: string[]) {
  let out = "";

  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const prev = tokens[i - 1];

    const noLeadingSpace = /^[,.;:!?)]$/.test(curr);
    const noTrailingSpaceFromPrev = prev && /^[(]$/.test(prev);

    if (i > 0 && !noLeadingSpace && !noTrailingSpaceFromPrev) {
      out += " ";
    }

    out += curr;
  }

  return out;
}

export function DiffTokens({
  parts,
  activeGroupId,
  setActiveGroupId,
}: {
  parts: DisplayPart[];
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
}) {
  return (
    <>
      {parts.map((part, index) => {
        const text = joinTokens(part.value);
        const isActive = Boolean(part.groupId && part.groupId === activeGroupId);

        if (part.replaced) {
          return (
            <span
              key={index}
              onMouseEnter={() => setActiveGroupId(part.groupId ?? null)}
              onMouseLeave={() => setActiveGroupId(null)}
              className={[
                "rounded px-1 transition-all duration-150 cursor-default",
                "bg-amber-200 text-amber-950",
                isActive ? "ring-2 ring-amber-400 shadow-sm" : "",
              ].join(" ")}
              data-replacement-group={part.groupId}
            >
              {text}
            </span>
          );
        }

        if (part.kind === "removed") {
          return (
            <span
              key={index}
              className="rounded bg-rose-200 px-1 text-rose-950 line-through"
            >
              {text}
            </span>
          );
        }

        if (part.kind === "added") {
          return (
            <mark
              key={index}
              className="rounded bg-emerald-200 px-1 text-emerald-950"
            >
              {text}
            </mark>
          );
        }

        return <span key={index}>{text}</span>;
      })}
    </>
  );
}