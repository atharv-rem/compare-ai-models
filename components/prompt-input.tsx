import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import sarvam30b from "../public/sarvam30b.png";
import sarvam105b from "../public/sarvam105b.png";
import mic from "../public/Vector.svg";
import stop from "../public/stop.svg";
import GitCompareIcon, { type GitCompareIconHandle } from "@/components/ui/compare-animated-icon";
import AudioLinesIcon from "@/components/ui/listening-waveform";
import { Plus, History } from "lucide-react";
import type { RefObject } from "react";

import {useEffect } from "react";

type PromptInputProps = {
  value: string;
  setValue: (value: string) => void;
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
  isListening: boolean;
  isCompareMode: boolean;
  hasPreviousChats?: boolean;
  onSeePreviousChats?: () => void;
  mockprompts: string[];
  currentPrompt: number;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  gitCompareRef: RefObject<GitCompareIconHandle | null>;
  handleCompareClick: () => void;
  handleNewChat: () => void;
  startListening: () => void;
  stopListening: () => void;
  isComparing: boolean;
}

export function PromptInput({
  value,
  setValue,
  isFocused,
  setIsFocused,
  isListening,
  isCompareMode,
  hasPreviousChats,
  onSeePreviousChats,
  mockprompts,
  currentPrompt,
  textareaRef,
  gitCompareRef,
  handleCompareClick,
  handleNewChat,
  startListening,
  stopListening,
  isComparing
}: PromptInputProps) {
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.maxHeight = "200px";

      if (isFocused) {
        textarea.style.height = "auto";
        const newHeight = Math.max(70, Math.min(textarea.scrollHeight, 200));
        textarea.style.height = `${newHeight}px`;
      } else {
        textarea.style.height = "40px";
      }
    }
  }, [value, isFocused, textareaRef]);

  return (
    <motion.div className="relative" layout transition={{ duration: 0.5, ease: "easeInOut" }}>

      {/* Placeholder text */}
      {!isFocused && value === "" && !isListening && !isCompareMode && (
        <div className="absolute top-3.75 left-5.5 pointer-events-none z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPrompt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-[15px] text-[#595959]"
            >
              {mockprompts[currentPrompt]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
      
      {/* Listening indicator */}
      {isListening && value === "" && (
        <div className="absolute top-4.5 left-5.5 pointer-events-none z-10 flex items-center gap-2">
          <AudioLinesIcon size={20} active={true} />
          <p className="text-[14px] text-[#595959]">Listening...</p>
        </div>
      )}
      
      {/* Textarea and buttons */}
      <div className="w-full rounded-[15px] border-[1.5px] border-[#F5F5F5] p-3 bg-white/60 backdrop-blur-sm flex flex-col transition-all focus-within:border-[#595959] outline-none shadow-none">
        <label htmlFor="prompt" className="sr-only">Enter your prompt</label>
        <textarea
          id="prompt"
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (value.trim()) {
                gitCompareRef.current?.startAnimation();
                handleCompareClick();
              }
            }
          }}
          className="w-full resize-none bg-transparent text-[15px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none transition-all overflow-y-auto min-h-10 border-none"
          rows={1}
        />
        
        <div className="flex flex-row items-center justify-between mt-3.75 w-full gap-2 flex-wrap sm:flex-nowrap">
          
          <div className="flex flex-row items-center gap-2 flex-wrap">
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
                aria-label="Create a new chat"
                className="flex items-center gap-2 px-3 py-1.5 border-[1.5px] border-[#F5F5F5] rounded-[10px] hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-colors text-[12px]"
              >
                <Plus size={16} />  
                New Chat
              </button>
            )}
          </div>

          <div className="flex flex-row items-center gap-2">
            {/* See previous chats button */}
            {!isCompareMode && hasPreviousChats && (
               <button
                  onClick={onSeePreviousChats}
                  aria-label="See previous chats"
                  className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2 justify-center hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-colors text-[12px]"
                >
                  <History size={16} />
                  See previous chats
                </button>
            )}

            {/* Compare button */}
            <button 
              onClick={handleCompareClick}
              aria-label="Compare model outputs"
              onMouseEnter={() => gitCompareRef.current?.startAnimation()}
              onMouseLeave={() => gitCompareRef.current?.stopAnimation()}
              className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2 justify-center hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!value.trim() || isComparing}
            >
              <GitCompareIcon ref={gitCompareRef} size={16} />
              <p className="text-center text-[12px]">{isComparing ? "Comparing..." : "Compare"}</p>
            </button>

            <button
              onClick={isListening ? stopListening : startListening}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              title={isListening ? "Stop voice input" : "Start voice input"}
              className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] justify-center p-1 focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none hover:bg-[#F5F5F5] transition-colors"
            >
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
