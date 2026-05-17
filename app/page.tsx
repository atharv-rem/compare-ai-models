"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import sarvam30b from "../public/sarvam30b.png";
import sarvam105b from "../public/sarvam105b.png";
import Image from "next/image";
import mic from "../public/Vector.svg"
import stop from "../public/stop.svg"
import { useRef } from "react";
import { useSpeechRecognition } from "@/components/hooks/useSpeechRecognition";
import GitCompareIcon from "@/components/ui/compare-animated-icon";
import AudioLinesIcon from "@/components/ui/listening-waveform";

export default function Home() {
  const mockprompts = [
    "ask anything",
    "Explain quantum computing like I'm 10",
    "Summarize this meeting into action items",
    "Explain recursion using a real-world analogy"
  ];
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prevIndex) => (prevIndex + 1) % mockprompts.length);
    }, 2000); 

    return () => clearInterval(interval);
  }, []);
  
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gitCompareRef = useRef<{ startAnimation: () => void; stopAnimation: () => void }>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isFocused) {
      textarea.style.height = "auto";
      const newHeight = Math.max(70, Math.min(textarea.scrollHeight, 200));
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, isFocused]);

  const {transcript, isListening, startListening, stopListening, error,} = useSpeechRecognition()
  
  useEffect(() => {
    if (transcript && isListening) {
      setValue(transcript);
    }
  }, [transcript, isListening]);

  const handleCompareClick = () => {
    setIsCompareMode(!isCompareMode);
  };

  // Shared prompt box component
  const PromptBox = ({ modelName, modelImage, showModel = true }: { modelName: string, modelImage: any, showModel?: boolean }) => (
    <div className="w-full rounded-[15px] border-[1.5px] border-[#F5F5F5] p-3 bg-white/60 backdrop-blur-sm flex flex-col transition-all focus-within:border-[#949494] outline-none shadow-none">
      <label htmlFor="prompt" className="text-[13px] text-[#949494] mb-1 hidden">Enter your prompt</label>
      <textarea
        id="prompt"
        ref={textareaRef}
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
        {showModel && (
          <div className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2">
            <Image src={modelImage} alt={modelName} width={15} height={15} className="rounded-[10px]" />
            <p className="text-center text-[12px]">{modelName}</p>
          </div>
        )}
        {!showModel && <div></div>}
        <div className="flex flex-row items-center gap-2">
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
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-[25px] font-main">compare model outputs in realtime</h1>
      
      <motion.div 
        className="mt-5 w-full max-w-3xl relative"
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          {!isCompareMode ? (
            // Single input mode
            <motion.div
              key="single"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {!isFocused && value === "" && !isListening && (
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

              {isListening && value === "" && (
                <div className="absolute top-[18px] left-[22px] pointer-events-none z-10 flex items-center gap-2">
                  <AudioLinesIcon size={20} />
                  <p className="text-[14px] text-[#949494]">Listening...</p>
                </div>
              )}

              <div className="w-full rounded-[15px] border-[1.5px] border-[#F5F5F5] p-3 bg-white/60 backdrop-blur-sm flex flex-col transition-all focus-within:border-[#949494] outline-none shadow-none">
                <label htmlFor="prompt" className="text-[13px] text-[#949494] mb-1 hidden">Enter your prompt</label>
                <textarea
                  id="prompt"
                  ref={textareaRef}
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
                    <div className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2">
                      <Image src={sarvam30b} alt="Sarvam 30B" width={15} height={15} className="rounded-[10px]" />
                      <p className="text-center text-[12px]">Sarvam 30B</p>
                    </div>
                    <div className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2">
                      <Image src={sarvam105b} alt="Sarvam 105B" width={15} height={15} className="rounded-[10px]" />
                      <p className="text-center text-[12px]">Sarvam 105B</p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <button 
                      onClick={handleCompareClick}
                      onMouseEnter={() => gitCompareRef.current?.startAnimation()}
                      onMouseLeave={() => gitCompareRef.current?.stopAnimation()}
                      className="flex flex-row items-center px-2 py-1 border-[1.5px] border-[#F5F5F5] rounded-[10px] gap-2 justify-center hover:bg-[#F5F5F5] transition-colors"
                    >
                      <GitCompareIcon ref={gitCompareRef} size={16} />
                      <p className="text-center text-[12px]">Compare</p>
                    </button>
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
          ) : (
            // Split compare mode
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Back button */}
              <button
                onClick={handleCompareClick}
                className="self-start flex items-center gap-2 px-3 py-1.5 border-[1.5px] border-[#F5F5F5] rounded-[10px] hover:bg-[#F5F5F5] transition-colors text-[12px]"
              >
                ← Exit Compare
              </button>

              {/* Split inputs */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <PromptBox modelName="Sarvam 30B" modelImage={sarvam30b} />
                </motion.div>
                
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <PromptBox modelName="Sarvam 105B" modelImage={sarvam105b} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}