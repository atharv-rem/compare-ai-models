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
  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: { model1: number, model2: number } }>({
    1: { model1: 0, model2: 0 }
  });
  const [tokensPerSecond, setTokensPerSecond] = useState<{ [key: number]: { model1: number, model2: number } }>({
    1: { model1: 0, model2: 0 }
  });
  const [executionTimes, setExecutionTimes] = useState<{ [key: number]: { model1: number, model2: number } }>({
    1: { model1: 0, model2: 0 }
  });
  const [timeToFirstByte, setTimeToFirstByte] = useState<{ [key: number]: { model1: number, model2: number } }>({
    1: { model1: 0, model2: 0 }
  });
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const savedChats = localStorage.getItem("compare-chats-data");
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        if (parsed.chats && parsed.chats.length > 0) {
          setChats(parsed.chats);
          setActiveChat(parsed.activeChat || 1);
          if (parsed.tokenCounts) setTokenCounts(parsed.tokenCounts);
          if (parsed.tokensPerSecond) setTokensPerSecond(parsed.tokensPerSecond);
          if (parsed.executionTimes) setExecutionTimes(parsed.executionTimes);
          if (parsed.timeToFirstByte) setTimeToFirstByte(parsed.timeToFirstByte);
          
          const current = parsed.chats.find((c: any) => c.id === (parsed.activeChat || 1));
          if (current) {
            setValue(current.prompt);
            if (current.outputs.model1 || current.outputs.model2) {
              setIsCompareMode(true);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("compare-chats-data", JSON.stringify({
        chats,
        activeChat,
        tokenCounts,
        tokensPerSecond,
        executionTimes,
        timeToFirstByte
      }));
    }
  }, [chats, activeChat, tokenCounts, tokensPerSecond, executionTimes, timeToFirstByte, isClient]);

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

      // Cycle chats with Ctrl/Cmd + Left/Right Arrow
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        setChats(currentChats => {
          if (currentChats.length <= 1) return currentChats;
          const currentIndex = currentChats.findIndex(c => c.id === activeChat);
          let newIndex;
          if (e.key === 'ArrowRight') {
            newIndex = (currentIndex + 1) % currentChats.length;
          } else {
            newIndex = (currentIndex - 1 + currentChats.length) % currentChats.length;
          }
          const nextChat = currentChats[newIndex];
          setActiveChat(nextChat.id);
          setValue(nextChat.prompt);
          return currentChats;
        });
      }

      // New Chat shortcut: Ctrl/Cmd + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, startListening, stopListening, activeChat]); // Added activeChat dependency

  // Handle compare button click
  const handleCompareClick = async () => {
    setIsCompareMode(true);
    const currentPromptValue = value;

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, prompt: currentPromptValue, outputs: { model1: "", model2: "" } }
        : chat
    ));
    setTimeToFirstByte(prev => ({
      ...prev,
      [activeChat]: { model1: 0, model2: 0 }
    }));

    try {
      const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array> | undefined, modelKey: "model1" | "model2") => {
        if (!reader) return;
        const decoder = new TextDecoder();
        const startTime = Date.now();
        let recordedFirstByte = false;
        let currentTokenCount = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });

            if (!recordedFirstByte) {
              const firstByteSeconds = (Date.now() - startTime) / 1000;
              setTimeToFirstByte(prev => ({
                ...prev,
                [activeChat]: {
                  ...prev[activeChat],
                  [modelKey]: Number(firstByteSeconds.toFixed(3))
                }
              }));
              recordedFirstByte = true;
            }

            const newTokens = chunk.trim().split(/\s+/).filter(Boolean).length;
            currentTokenCount += newTokens;

            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const tps = elapsedSeconds > 0 ? currentTokenCount / elapsedSeconds : 0;
            
            setTokenCounts(prev => ({
              ...prev,
              [activeChat]: {
                ...prev[activeChat],
                [modelKey]: prev[activeChat][modelKey] + newTokens
              }
            }));

            setTokensPerSecond(prev => ({
              ...prev,
              [activeChat]: {
                ...prev[activeChat],
                [modelKey]: Number(tps.toFixed(1))
              }
            }));

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

            setExecutionTimes(prev => ({
              ...prev,
              [activeChat]: {
                ...prev[activeChat],
                [modelKey]: Number(elapsedSeconds.toFixed(1))
              }
            }));
          }
        } catch (streamError) {
          console.error(`Stream interrupted for ${modelKey}:`, streamError);
          setChats(prev => prev.map(chat => 
            chat.id === activeChat 
              ? { 
                  ...chat, 
                  outputs: { 
                    ...chat.outputs,
                    [modelKey]: chat.outputs[modelKey] + "\n\n[Warning: Stream interrupted. Partial output preserved.]"
                  } 
                }
              : chat
          ));
        }
      };

      const fetchAndStream = async (model: string, modelKey: "model1" | "model2") => {
        try {
          const res = await fetch(`/api/chat?t=${Date.now()}&m=${modelKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, message: currentPromptValue })
          });
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const reader = res.body?.getReader();
          await readStream(reader, modelKey);
        } catch (fetchError) {
          console.error(`Fetch failed for ${modelKey}:`, fetchError);
          setChats(prev => prev.map(chat => 
            chat.id === activeChat 
              ? { 
                  ...chat, 
                  outputs: { 
                    ...chat.outputs,
                    [modelKey]: chat.outputs[modelKey] 
                      ? chat.outputs[modelKey] + "\n\n[Error: Connection dropped.]"
                      : "[Error: Failed to connect to API.]"
                  } 
                }
              : chat
          ));
        }
      };

      await Promise.allSettled([
        fetchAndStream("sarvam-30b", "model1"),
        fetchAndStream("sarvam-105b", "model2")
      ]);

    } catch (error) {
      console.error("Unexpected error during compare operation:", error);
      // We no longer overwrite the entire state since fetchAndStream handles its own errors gracefully.
    }
  };

  // Handle new chat button click
  const handleNewChat = () => {
    const newChatId = chats.length > 0 ? Math.max(...chats.map(c => c.id)) + 1 : 1;
    setChats(prev => [...prev, { id: newChatId, prompt: "", outputs: { model1: "", model2: "" } }]);
    setTokenCounts(prev => ({
      ...prev,
      [newChatId]: { model1: 0, model2: 0 }
    }));
    setTokensPerSecond(prev => ({
      ...prev,
      [newChatId]: { model1: 0, model2: 0 }
    }));
    setExecutionTimes(prev => ({
      ...prev,
      [newChatId]: { model1: 0, model2: 0 }
    }));
    setActiveChat(newChatId);
    setValue("");
    setIsCompareMode(false);
  };

  const handleDeleteChat = (id: number) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        // If no chats left, create a fresh one and exit compare mode
        const newChat = { id: 1, prompt: "", outputs: { model1: "", model2: "" } };
        setActiveChat(1);
        setValue("");
        setIsCompareMode(false);
        return [newChat];
      }
      
      // If we deleted the active chat, switch to another one
      if (activeChat === id) {
        const remainingChat = filtered[filtered.length - 1];
        setActiveChat(remainingChat.id);
        setValue(remainingChat.prompt);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    setChats([{ id: 1, prompt: "", outputs: { model1: "", model2: "" } }]);
    setTokenCounts({ 1: { model1: 0, model2: 0 } });
    setTokensPerSecond({ 1: { model1: 0, model2: 0 } });
    setExecutionTimes({ 1: { model1: 0, model2: 0 } });
    setTimeToFirstByte({ 1: { model1: 0, model2: 0 } });
    setActiveChat(1);
    setValue("");
    setIsCompareMode(false);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <main 
      className={`flex min-h-screen flex-col items-center px-4 py-8 transition-colors duration-500 ${isCompareMode ? "justify-start bg-white" : "justify-center bg-[url('/background.png')] bg-cover bg-center"}`}
    >
      {!isCompareMode && (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-[25px] font-main text-center">compare model outputs in realtime</h1>
        </div>
      )}
      
      <motion.div 
        className="mt-5 w-full"
        animate={{ maxWidth: isCompareMode ? "72rem" : "48rem" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {isCompareMode && chats.length > 0 && (
          <ChatTabs 
             chats={chats}
             activeChat={activeChat}
             setActiveChat={setActiveChat}
             setValue={setValue}
             onDeleteChat={handleDeleteChat}
             onClearAll={handleClearAll}
          />
        )}

        <PromptInput 
          value={value}
          setValue={setValue}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          isListening={isListening}
          isCompareMode={isCompareMode}
          hasPreviousChats={chats.some(chat => chat.outputs.model1 || chat.outputs.model2)}
          onSeePreviousChats={() => {
            const lastChatWithOutput = [...chats].reverse().find(c => c.outputs.model1 || c.outputs.model2);
            if (lastChatWithOutput) {
              setActiveChat(lastChatWithOutput.id);
              setValue(lastChatWithOutput.prompt);
            }
            setIsCompareMode(true);
          }}
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

        <OutputComparison 
          isCompareMode={isCompareMode} 
          currentChat={currentChat}
          tokenCounts={tokenCounts[activeChat] || { model1: 0, model2: 0 }}
          tokensPerSecond={tokensPerSecond[activeChat] || { model1: 0, model2: 0 }}
          executionTimes={executionTimes[activeChat] || { model1: 0, model2: 0 }}
          timeToFirstByte={timeToFirstByte[activeChat] || { model1: 0, model2: 0 }}
        />
      </motion.div>
    </main>
  );
}
