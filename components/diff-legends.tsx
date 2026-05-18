import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
  PreviewCardArrow,
} from "./ui/preview-card";
import { CopyMinus, CopyPlus, Replace, AlignLeft } from "lucide-react";

export default function DiffLegend() {
  return (
    <div className="w-full mb-4 flex flex-row items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-[12px] text-[#4B5563] backdrop-blur-sm">
      <PreviewCard>
        <PreviewCardTrigger delay={200} closeDelay={150} className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-black">
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          <span>Unchanged</span>
        </PreviewCardTrigger>
        <PreviewCardPopup className="w-60 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1">
            <AlignLeft className="w-4 h-4 text-gray-500" />
            Unchanged
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Text that is identical in both model outputs. It forms the base context that both models agreed on.
          </div>
          <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
        </PreviewCardPopup>
      </PreviewCard>

      <PreviewCard>
        <PreviewCardTrigger delay={200} closeDelay={150} className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#F7C9D0] bg-rose-50 px-2 py-1 text-rose-900 outline-none focus-visible:ring-2 focus-visible:ring-black">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span>Removed from left</span>
        </PreviewCardTrigger>
        <PreviewCardPopup className="w-60 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
          <div className="flex items-center gap-2 text-rose-800 font-semibold mb-1">
            <CopyMinus className="w-4 h-4 text-rose-500" />
            Removed from left
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Words that the first model (Sarvam 30B) generated, but the second model (Sarvam 105B) decided to omit.
          </div>
          <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
        </PreviewCardPopup>
      </PreviewCard>

      <PreviewCard>
        <PreviewCardTrigger delay={200} closeDelay={150} className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[#BFE7CC] bg-emerald-50 px-2 py-1 text-emerald-900 outline-none focus-visible:ring-2 focus-visible:ring-black">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span>Added on right</span>
        </PreviewCardTrigger>
        <PreviewCardPopup className="w-60 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
            <CopyPlus className="w-4 h-4 text-emerald-500" />
            Added on right
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            New words or phrasing introduced by the second model (Sarvam 105B) that weren't present in the first model's output.
          </div>
          <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
        </PreviewCardPopup>
      </PreviewCard>

      <PreviewCard>
        <PreviewCardTrigger delay={200} closeDelay={150} className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-900 outline-none focus-visible:ring-2 focus-visible:ring-black">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span>Replacement</span>
        </PreviewCardTrigger>
        <PreviewCardPopup className="w-60 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
          <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
            <Replace className="w-4 h-4 text-blue-500" />
            Replacement
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Sections where text was substituted. Hover over these highlighted tokens to instantly see how they match up across both outputs.
          </div>
          <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
        </PreviewCardPopup>
      </PreviewCard>
    </div>
  );
}