"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import sarvam30b from "../public/sarvam30b.png";
import sarvam105b from "../public/sarvam105b.png";
import UnicodeSpinner from "./ui/unicode-spinner";
import { diffText } from "@/lib/markdown-diff";
import { MarkdownDiffView } from "./markdown-diff-view";
import DiffLegend from "./diff-legends";
import { Separator } from "./ui/separator";
import {
  PreviewCard,
  PreviewCardTrigger,
  PreviewCardPopup,
  PreviewCardArrow,
} from "./ui/preview-card";

type Chat = {
  id: number;
  prompt: string;
  outputs: { model1: string; model2: string };
};

type OutputComparisonProps = {
  isCompareMode: boolean;
  currentChat?: Chat;
  tokenCounts: { model1: number; model2: number };
  tokensPerSecond: { model1: number; model2: number };
  executionTimes: { model1: number; model2: number };
};

function WaitingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <UnicodeSpinner name="orbit" className="text-gray-500" />
      <p className="text-[#595959] italic">{text}</p>
    </div>
  );
}

export function OutputComparison({
  isCompareMode,
  currentChat,
  tokenCounts,
  tokensPerSecond,
  executionTimes,
}: OutputComparisonProps) {
  const leftOutput = currentChat?.outputs.model1 ?? "";
  const rightOutput = currentChat?.outputs.model2 ?? "";
  const parts = diffText(leftOutput, rightOutput);
  const showLegend = Boolean(leftOutput || rightOutput);
  const [activeReplacementGroup, setActiveReplacementGroup] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isCompareMode && currentChat && (
        <motion.div
          key="comparison-container"
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6"
        >
          {showLegend && <DiffLegend />}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="relative rounded-[15px] border-[1.5px] border-[#F5F5F5] bg-white/60 p-4 backdrop-blur-sm"
            >
              <div className="flex flex-col items-start justify-between gap-2 pb-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src={sarvam30b}
                    alt="Sarvam 30B"
                    width={20}
                    height={20}
                    className="rounded-[10px]"
                  />
                  <p className="text-[14px] font-medium">Sarvam 30B</p>
                </div>

                {leftOutput && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-0">
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-medium text-[#595959] outline-none">
                        {tokenCounts.model1} tokens
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Token count</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The number of tokens generated in this model response.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#D5ECA5] bg-[#F2FCE2] px-2 py-0.5 text-[11px] font-medium text-[#4A5D23] outline-none">
                        {tokensPerSecond.model1} t/s
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Tokens per second</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The generation speed, measured as how many tokens the model produced per second.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#BDE0FE] bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-medium text-[#0369A1] outline-none">
                        {executionTimes.model1}s
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Execution time</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The total time taken by the model to generate this response.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                  </div>
                )}
              </div>
              
              <Separator className="mb-3 bg-[#F5F5F5]" />

              <div className="min-h-50 max-h-100 overflow-y-auto text-[14px] text-gray-800">
                {leftOutput ? (
                  <MarkdownDiffView
                    parts={parts}
                    side="left"
                    activeGroupId={activeReplacementGroup}
                    setActiveGroupId={setActiveReplacementGroup}
                  />
                ) : (
                  <WaitingState text="Waiting for response..." />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="relative rounded-[15px] border-[1.5px] border-[#F5F5F5] bg-white/60 p-4 backdrop-blur-sm"
            >
              <div className="flex flex-col items-start justify-between gap-2 pb-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Image
                    src={sarvam105b}
                    alt="Sarvam 105B"
                    width={20}
                    height={20}
                    className="rounded-[10px]"
                  />
                  <p className="text-[14px] font-medium">Sarvam 105B</p>
                </div>

                {rightOutput && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-0">
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-medium text-[#595959] outline-none">
                        {tokenCounts.model1} tokens
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Token count</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The number of tokens generated in this model response.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#D5ECA5] bg-[#F2FCE2] px-2 py-0.5 text-[11px] font-medium text-[#4A5D23] outline-none">
                        {tokensPerSecond.model1} t/s
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Tokens per second</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The generation speed, measured as how many tokens the model produced per second.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                    <PreviewCard>
                      <PreviewCardTrigger className="rounded-full border border-[#BDE0FE] bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-medium text-[#0369A1] outline-none">
                        {executionTimes.model1}s
                      </PreviewCardTrigger>
                      <PreviewCardPopup className="w-64 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl rounded-xl">
                        <div className="text-sm font-semibold text-gray-800">Execution time</div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          The total time taken by the model to generate this response.
                        </div>
                        <PreviewCardArrow className="fill-white [&>path]:stroke-[#EAEAEA] stroke-[0.5]" />
                      </PreviewCardPopup>
                    </PreviewCard>
                  </div>
                )}
              </div>

              <Separator className="mb-3 bg-[#F5F5F5]" />

              <div className="min-h-50 max-h-100 overflow-y-auto text-[14px] text-gray-800">
                {rightOutput ? (
                  <MarkdownDiffView
                    parts={parts}
                    side="right"
                    activeGroupId={activeReplacementGroup}
                    setActiveGroupId={setActiveReplacementGroup}
                  />
                ) : (
                  <WaitingState text="Waiting for response..." />
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}