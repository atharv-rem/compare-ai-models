import { DisplayPart } from "@/lib/markdown-diff";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
  PreviewCardArrow,
} from "./ui/preview-card";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
  PopoverArrow,
} from "./ui/popover";
import { useState, useEffect } from "react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {parts.map((part, index) => {
        const text = renderTokenText(part.tokens);
        const isActive = Boolean(part.groupId && part.groupId === activeGroupId);

        if (part.replaced) {
          const TriggerContainer = isMobile ? Popover : PreviewCard;
          const Trigger = isMobile ? PopoverTrigger : PreviewCardTrigger;
          const Popup = isMobile ? PopoverPopup : PreviewCardPopup;
          const Arrow = isMobile ? PopoverArrow : PreviewCardArrow;

          return (
            <TriggerContainer key={index}>
              <Trigger
                {...(!isMobile ? { delay: 200, closeDelay: 150 } : {})}
                onMouseEnter={() => setActiveGroupId(part.groupId ?? null)}
                onMouseLeave={() => setActiveGroupId(null)}
                className={[
                  "rounded px-1 transition-all duration-150 cursor-default outline-none inline-span",
                  "bg-blue-200/85 text-blue-950",
                  isActive ? "ring-2 ring-black shadow-sm" : "",
                ].join(" ")}
              >
                {text}
              </Trigger>
              <Popup className="max-w-96 w-fit flex gap-2 p-2 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl z-50">
                <div className="text-[12px] font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {renderTokenText(part.otherTokens)}
                </div>
                <Arrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
              </Popup>
            </TriggerContainer>
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