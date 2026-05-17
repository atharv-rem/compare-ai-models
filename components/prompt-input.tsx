import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import sarvam30b from "../public/sarvam30b.png";
import sarvam105b from "../public/sarvam105b.png";
import mic from "../public/Vector.svg";
import stop from "../public/stop.svg";
import GitCompareIcon from "@/components/ui/compare-animated-icon";
import AudioLinesIcon from "@/components/ui/listening-waveform";
import { Plus } from "lucide-react";

import {useEffect } from "react";

type PromptInputProps = {
  value: string;
  setValue: (value: string) => void;
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
  isListening: boolean;
  isCompareMode: boolean;
  mockprompts: string[];
  currentPrompt: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  gitCompareRef: React.RefObject<any>;
  handleCompareClick: () => void;
  handleNewChat: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export function PromptInput({
  value,
  setValue,
  isFocused,
  setIsFocused,
  isListening,
  isCompareMode,
  mockprompts,
  currentPrompt,
  textareaRef,
  gitCompareRef,
  handleCompareClick,
  handleNewChat,
  startListening,
  stopListening
}: PromptInputProps) {
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isFocused) {
      textarea.style.height = "auto";
      const newHeight = Math.max(70, Math.min(textarea.scrollHeight, 200));
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, isFocused, textareaRef]);

  return (
    <motion.div className="relative" layout transition={{ duration: 0.5, ease: "easeInOut" }}>

      {/* Placeholder text */}
      {!isFocused && value === "" && !isListening && !isCompareMode && (
        <div className="absolute top-[15px] left-[22px] pointer-events-none z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPrompt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-[15px] text-[#949494]"
            >
              {mockprompts[currentPrompt]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
      
      {/* Listening indicator */}
      {isListening && value === "" && (
        <div className="absolute top-[18px] left-[22px] pointer-events-none z-10 flex items-center gap-2">
          <AudioLinesIcon size={20} active={true} />
          <p className="text-[14px] text-[#949494]">Listening...</p>
        </div>
      )}
      
      {/* Textarea and buttons */}
      <div className="w-full rounded-[15px] border-[1.5px] border-[#F5F5F5] p-3 bg-white/60 backdrop-blur-sm flex flex-col transition-all focus-within:border-[#949494] outline-none shadow-none">
        <label htmlFor="prompt" className="text-[13px] text-[#949494] mb-1 hidden">Enter your prompt</label>
        <textarea
          id="prompt"
          ref={textareaRef as any}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full resize-none bg-transparent text-[15px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none transition-all overflow-y-auto min-h-[40px] border-none"
          style={{
            height: isFocused || value !== "" ? "auto" : "40px",
            maxHeight: "200px",
          }}
          rows={1}
        />
        
        <div className="flex flex-row items-center justify-between mt-[15px] w-full">
          
          <div className="flex flex-row items-center gap-2">
            {/* Model labels and Compare button */}
            {!isCompareMode && (
              <>
                <div className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2">
                  <Image src={sarvam30b} alt="Sarvam 30B" width={15} height={15} className="rounded-[10px]" />
                  <p className="text-center text-[12px]">Sarvam 30B</p>
                </div>
                <div className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2">
                  <Image src={sarvam105b} alt="Sarvam 105B" width={15} height={15} className="rounded-[10px]" />
                  <p className="text-center text-[12px]">Sarvam 105B</p>
                </div>
              </>
            )}
            {/* New Chat button in compare mode */}
            {isCompareMode && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-1.5 border-[1.5px] border-[#F5F5F5] rounded-[10px] hover:bg-[#F5F5F5] transition-colors text-[12px]"
              >
                <Plus size={16} />  
                New Chat
              </button>
            )}
          </div>

          <div className="flex flex-row items-center gap-2">
            {/* Compare button */}
            {!isCompareMode && (
              <button 
                onClick={handleCompareClick}
                onMouseEnter={() => gitCompareRef.current?.startAnimation()}
                onMouseLeave={() => gitCompareRef.current?.stopAnimation()}
                className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2 justify-center hover:bg-[#F5F5F5] transition-colors"
                disabled={!value.trim()}
              >
                <GitCompareIcon ref={gitCompareRef as any} size={16} />
                <p className="text-center text-[12px]">Compare</p>
              </button>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              title={isListening ? "Stop voice input" : "Start voice input"}
              className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] justify-center p-1">
              {isListening ? (
                <Image src={stop} alt="Stop Voice Input" width={13} height={13} />
              ) : (
                <Image src={mic} alt="Voice Input" width={13} height={13} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}