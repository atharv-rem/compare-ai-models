import { BlockDiff, toDisplayParts } from "@/lib/markdown-diff";
import { DiffTokens } from "./diff-tokens";

export function MarkdownDiffView({
  diffs,
  side,
  activeGroupId,
  setActiveGroupId,
}: {
  diffs: BlockDiff[];
  side: "left" | "right";
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      {diffs.map((diff, index) => {
        const block = side === "left" ? diff.leftBlock : diff.rightBlock;
        if (!block) return null;

        const parts = toDisplayParts(diff.parts, side);

        if (block.type === "heading") {
          const Tag = `h${Math.min(block.level || 2, 6)}` as any;
          return (
            <Tag key={index} className="font-semibold">
              <DiffTokens
                parts={parts}
                activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId}
              />
            </Tag>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-sm text-slate-100 whitespace-pre-wrap"
            >
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          return (
            <div key={index} className="whitespace-pre-wrap leading-7">
              <DiffTokens
                parts={parts}
                activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId}
              />
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <pre
              key={index}
              className="whitespace-pre-wrap rounded bg-slate-100 p-3 text-sm"
            >
              <DiffTokens
                parts={parts}
                activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId}
              />
            </pre>
          );
        }

        return (
          <p key={index} className="leading-7">
            <DiffTokens
              parts={parts}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
            />
          </p>
        );
      })}
    </div>
  );
}