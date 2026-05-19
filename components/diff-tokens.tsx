import { DisplayPart } from "@/lib/markdown-diff";
import {
  Drawer,
  DrawerPopup,
  DrawerTrigger,
} from "./ui/drawer";

function renderTokenText(tokens: DisplayPart["tokens"] | undefined) {
  if (!tokens) return "";
  return tokens.map((token) => `${token.leading}${token.text}`).join("");
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
        const text = renderTokenText(part.tokens);
        const isActive = Boolean(part.groupId && part.groupId === activeGroupId);

        if (part.replaced) {
          return (
            <Drawer key={index} position="bottom">
              <DrawerTrigger
                onMouseEnter={() => setActiveGroupId(part.groupId ?? null)}
                onMouseLeave={() => setActiveGroupId(null)}
                className={[
                  "rounded px-1 transition-all duration-150 cursor-pointer outline-none inline-span",
                  "bg-blue-200/85 text-blue-950",
                  isActive ? "ring-2 ring-black shadow-sm" : "",
                ].join(" ")}
              >
                {text}
              </DrawerTrigger>
              <DrawerPopup variant="straight" className="flex flex-col gap-2 p-6 z-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-lg font-semibold text-gray-900 leading-none">Token Comparison</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">This model</span>
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50 mb-0.5">
                      {part.tokens.length} {part.tokens.length === 1 ? 'token' : 'tokens'}
                    </span>
                  </div>
                  <div className="text-[14px] font-medium text-blue-900 bg-blue-50 p-2 rounded leading-relaxed whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Other model</span>
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-50/50 px-1.5 py-0.5 rounded border border-gray-200/50 mb-0.5">
                      {part.otherTokens?.length ?? 0} {(part.otherTokens?.length ?? 0) === 1 ? 'token' : 'tokens'}
                    </span>
                  </div>
                  <div className="text-[14px] font-medium text-gray-800 bg-gray-50 p-2 rounded leading-relaxed whitespace-pre-wrap">
                    {renderTokenText(part.otherTokens)}
                  </div>
                </div>
              </DrawerPopup>
            </Drawer>
          );
        }

        if (part.kind === "removed") {
          return (
            <span
              key={index}
              className="rounded bg-rose-200/80 px-1 text-rose-950"
            >
              {text}
            </span>
          );
        }

        if (part.kind === "added") {
          return (
            <mark
              key={index}
              className="rounded bg-emerald-200/80 px-1 text-emerald-950"
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