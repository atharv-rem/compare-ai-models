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
}

export function OutputComparison({ isCompareMode, currentChat }: OutputComparisonProps) {
  return (
    <AnimatePresence>
      {isCompareMode && currentChat && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          {/* Sarvam 30B Output */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="rounded-[15px] border-[1.5px] border-[#F5F5F5] p-4 bg-white/60 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F5F5F5]">
              <Image src={sarvam30b} alt="Sarvam 30B" width={20} height={20} className="rounded-[10px]" />
              <p className="text-[14px] font-medium">Sarvam 30B</p>
            </div>
            <div className="text-[14px] text-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {currentChat.outputs.model1 || (
                <>
                <UnicodeSpinner name="orbit" className="text-gray-400" />
                <p className="text-[#949494] italic">Waiting for response...</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Sarvam 105B Output */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="rounded-[15px] border-[1.5px] border-[#F5F5F5] p-4 bg-white/60 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F5F5F5]">
              <Image src={sarvam105b} alt="Sarvam 105B" width={20} height={20} className="rounded-[10px]" />
              <p className="text-[14px] font-medium">Sarvam 105B</p>
            </div>
            <div className="text-[14px] text-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {currentChat.outputs.model2 || (
                <>
                <UnicodeSpinner name="orbit" className="text-gray-400" />
                <p className="text-[#949494] italic">Waiting for response...</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}