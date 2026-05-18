import { DiffPart, toDisplayParts } from "@/lib/markdown-diff";
import { DiffTokens } from "./diff-tokens";

export function MarkdownDiffView({
  parts,
  side,
  activeGroupId,
  setActiveGroupId,
}: {
  parts: DiffPart[];
  side: "left" | "right";
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
}) {
  const displayParts = toDisplayParts(parts, side);

  return (
    <div className="whitespace-pre-wrap leading-7">
      <DiffTokens
        parts={displayParts}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
      />
    </div>
  );
}