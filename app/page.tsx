"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useSpeechRecognition } from "@/components/hooks/useSpeechRecognition";
import { ChatTabs } from "@/components/chat-tabs";
import { ShortcutHints } from "@/components/shortcut-hints";
import { OutputComparison } from "@/components/output-comparison";
import { PromptInput } from "@/components/prompt-input";

export default function Home() {
  const mockprompts = [
    "ask anything",
    "Explain quantum computing like I'm 10",
    "Summarize this meeting into action items",
    "Explain recursion using a real-world analogy"
  ];

  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [chats, setChats] = useState([{ id: 1, prompt: "", outputs: { model1: "", model2: "" } }]);
  const [activeChat, setActiveChat] = useState(1);
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gitCompareRef = useRef<{ startAnimation: () => void; stopAnimation: () => void }>(null);

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();

  // Cycle through mock prompts every 2 seconds initially
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prevIndex) => (prevIndex + 1) % mockprompts.length);
    }, 2000); 

    return () => clearInterval(interval);
  }, [mockprompts.length]);

  // Update value with transcript when listening
  useEffect(() => {
    if (transcript && isListening) {
      setValue(transcript);
    }
  }, [transcript, isListening]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus text input on '/'
      if (e.key === '/' && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      
      // Toggle voice input on Cmd+M or Ctrl+M
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, startListening, stopListening]);

  // Handle compare button click
  const handleCompareClick = async () => {
    setIsCompareMode(true);
    const currentPromptValue = value;

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, prompt: currentPromptValue, outputs: { model1: "", model2: "" } }
        : chat
    ));

    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sarvam-30b", message: currentPromptValue })
        }),
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sarvam-105b", message: currentPromptValue })
        })
      ]);

      const reader1 = res1.body?.getReader();
      const reader2 = res2.body?.getReader();

      const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array> | undefined, modelKey: "model1" | "model2") => {
        if (!reader) return;
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          setChats(prev => prev.map(chat => 
            chat.id === activeChat 
              ? { 
                  ...chat, 
                  outputs: { 
                    ...chat.outputs,
                    [modelKey]: chat.outputs[modelKey] + chunk
                  } 
                }
              : chat
          ));
        }
      };

      await Promise.all([
        readStream(reader1, "model1"),
        readStream(reader2, "model2")
      ]);

    } catch (error) {
      console.error("Failed to fetch responses:", error);
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { 
              ...chat, 
              outputs: { model1: "Failed to connect to API.", model2: "Failed to connect to API." } 
            }
          : chat
      ));
    }
  };

  // Handle new chat button click
  const handleNewChat = () => {
    const newChatId = chats.length + 1;
    setChats(prev => [...prev, { id: newChatId, prompt: "", outputs: { model1: "", model2: "" } }]);
    setActiveChat(newChatId);
    setValue("");
    setIsCompareMode(false);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <h1 className="text-[25px] font-main">compare model outputs in realtime</h1>
      
      <motion.div 
        className="mt-5 w-full"
        animate={{ maxWidth: isCompareMode ? "72rem" : "48rem" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {isCompareMode && chats.length > 1 && (
          <ChatTabs 
             chats={chats}
             activeChat={activeChat}
             setActiveChat={setActiveChat}
             setValue={setValue}
          />
        )}

        <PromptInput 
          value={value}
          setValue={setValue}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          isListening={isListening}
          isCompareMode={isCompareMode}
          mockprompts={mockprompts}
          currentPrompt={currentPrompt}
          textareaRef={textareaRef}
          gitCompareRef={gitCompareRef}
          handleCompareClick={handleCompareClick}
          handleNewChat={handleNewChat}
          startListening={startListening}
          stopListening={stopListening}
        />

        {!isCompareMode && <ShortcutHints />}

        <OutputComparison isCompareMode={isCompareMode} currentChat={currentChat}/>
      </motion.div>
    </main>
  );
}