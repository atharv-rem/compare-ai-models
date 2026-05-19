import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
  PreviewCardArrow,
} from "./ui/preview-card";
import {
  Drawer,
  DrawerPopup,
  DrawerTrigger,
} from "./ui/drawer";
import { CopyMinus, CopyPlus, Replace, AlignLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function DiffLegend() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const items = [
    {
      label: "Unchanged",
      dotClass: "bg-gray-300",
      triggerClass: "border-[#E5E7EB] bg-white",
      icon: <AlignLeft className="w-4 h-4 text-gray-500" />,
      title: "Unchanged",
      description: "Text that is identical in both model outputs. It forms the base context that both models agreed on.",
      textColor: "text-gray-800"
    },
    {
      label: "Removed from left",
      dotClass: "bg-rose-300",
      triggerClass: "border-[#F7C9D0] bg-rose-50 text-rose-900",
      icon: <CopyMinus className="w-4 h-4 text-rose-500" />,
      title: "Removed from left",
      description: "Words that the first model (Sarvam 30B) generated, but the second model (Sarvam 105B) decided to omit.",
      textColor: "text-rose-800"
    },
    {
      label: "Added on right",
      dotClass: "bg-emerald-300",
      triggerClass: "border-[#BFE7CC] bg-emerald-50 text-emerald-900",
      icon: <CopyPlus className="w-4 h-4 text-emerald-500" />,
      title: "Added on right",
      description: "New words or phrasing introduced by the second model (Sarvam 105B) that weren't present in the first model's output.",
      textColor: "text-emerald-800"
    },
    {
      label: "Replacement",
      dotClass: "bg-blue-400",
      triggerClass: "border-blue-200 bg-blue-50 text-blue-900",
      icon: <Replace className="w-4 h-4 text-blue-500" />,
      title: "Replacement",
      description: "Sections where text was substituted. Click these highlighted tokens to instantly see how they match up across both outputs.",
      textColor: "text-blue-800"
    }
  ];

  return (
    <div className="w-full mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex flex-nowrap items-center justify-start md:justify-center gap-2 rounded-[14px] px-3 py-2 text-[12px] text-[#4B5563] backdrop-blur-sm min-w-max">
        {items.map((item, idx) => {
          if (isMobile) {
            return (
              <Drawer key={idx} position="bottom">
                <DrawerTrigger 
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-black ${item.triggerClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
                  <span>{item.label}</span>
                </DrawerTrigger>
                <DrawerPopup variant="straight" className="flex flex-col gap-2 p-6 z-50">
                  <div className={`flex items-center gap-2 font-semibold mb-2 text-base ${item.textColor}`}>
                    {item.icon}
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </div>
                </DrawerPopup>
              </Drawer>
            );
          }

          return (
            <PreviewCard key={idx}>
              <PreviewCardTrigger 
                delay={200} closeDelay={150}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-black ${item.triggerClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
                <span>{item.label}</span>
              </PreviewCardTrigger>
              <PreviewCardPopup className="w-60 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                <div className={`flex items-center gap-2 font-semibold mb-1 ${item.textColor}`}>
                  {item.icon}
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  {item.description}
                </div>
                <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
              </PreviewCardPopup>
            </PreviewCard>
          );
        })}
      </div>
    </div>
  );
}