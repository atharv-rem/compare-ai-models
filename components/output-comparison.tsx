import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import sarvam30b from "../public/sarvam30b.png";
import sarvam105b from "../public/sarvam105b.png";
import UnicodeSpinner from "./ui/unicode-spinner";

type Chat = {
  id: number;
  prompt: string;
  outputs: { model1: string; model2: string; };
}

type OutputComparisonProps = {
  isCompareMode: boolean;
  currentChat?: Chat;
  tokenCounts: { model1: number; model2: number };
  tokensPerSecond: { model1: number; model2: number };
  executionTimes: { model1: number; model2: number };
}

export function OutputComparison({ isCompareMode, currentChat, tokenCounts, tokensPerSecond, executionTimes }: OutputComparisonProps) {
  return (
    <AnimatePresence>
      {isCompareMode && currentChat && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Sarvam 30B Output */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="rounded-[15px] border-[1.5px] border-[#F5F5F5] p-4 bg-white/60 backdrop-blur-sm relative"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <Image src={sarvam30b} alt="Sarvam 30B" width={20} height={20} className="rounded-[10px]" />
                <p className="text-[14px] font-medium">Sarvam 30B</p>
              </div>
              {currentChat.outputs.model1 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
                  <div className="bg-[#F5F5F5] px-2 py-0.5 rounded-full text-[11px] text-[#595959] font-medium border border-[#E5E5E5]">
                    {tokenCounts.model1} tokens
                  </div>
                  <div className="bg-[#F2FCE2] px-2 py-0.5 rounded-full text-[11px] text-[#4A5D23] font-medium border border-[#D5ECA5]">
                    {tokensPerSecond.model1} t/s
                  </div>
                  <div className="bg-[#E0F2FE] px-2 py-0.5 rounded-full text-[11px] text-[#0369A1] font-medium border border-[#BDE0FE]">
                    {executionTimes.model1}s
                  </div>
                </div>
              )}
            </div>
            <div className="text-[14px] text-gray-800 min-h-50 max-h-100 overflow-y-auto whitespace-pre-wrap">
              {currentChat.outputs.model1 || (
                <div className="flex flex-col items-center gap-2">
                <UnicodeSpinner name="orbit" className="text-gray-500" />
                <p className="text-[#595959] italic">Waiting for response...</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sarvam 105B Output */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="rounded-[15px] border-[1.5px] border-[#F5F5F5] p-4 bg-white/60 backdrop-blur-sm relative"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <Image src={sarvam105b} alt="Sarvam 105B" width={20} height={20} className="rounded-[10px]" />
                <p className="text-[14px] font-medium">Sarvam 105B</p>
              </div>
              {currentChat.outputs.model2 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
                  <div className="bg-[#F5F5F5] px-2 py-0.5 rounded-full text-[11px] text-[#595959] font-medium border border-[#E5E5E5]">
                    {tokenCounts.model2} tokens
                  </div>
                  <div className="bg-[#F2FCE2] px-2 py-0.5 rounded-full text-[11px] text-[#4A5D23] font-medium border border-[#D5ECA5]">
                    {tokensPerSecond.model2} t/s
                  </div>
                  <div className="bg-[#E0F2FE] px-2 py-0.5 rounded-full text-[11px] text-[#0369A1] font-medium border border-[#BDE0FE]">
                    {executionTimes.model2}s
                  </div>
                </div>
              )}
            </div>
            <div className="text-[14px] text-gray-800 min-h-50 max-h-100 overflow-y-auto whitespace-pre-wrap">
              {currentChat.outputs.model2 || (
                <div className="flex flex-col items-center gap-2">
                  <UnicodeSpinner name="orbit" className="text-gray-500" />
                  <p className="text-[#595959] italic">waiting for response...</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}