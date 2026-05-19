"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { useSpeechRecognition } from "@/components/hooks/useSpeechRecognition";
import { ChatTabs } from "@/components/chat-tabs";
import { ShortcutHints } from "@/components/shortcut-hints";
import { OutputComparison } from "@/components/output-comparison";
import { PromptInput } from "@/components/prompt-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ModelPairNumbers = { model1: number; model2: number };
type ModelPairErrors = { model1: string | null; model2: string | null };
type UsageSnapshot = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};
type UsagePair = { model1: UsageSnapshot; model2: UsageSnapshot };

type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "usage"; usage: UsageSnapshot }
  | {
      type: "error";
      error: {
        message: string;
        code: string;
        request_id?: string;
      };
    }
  | { type: "done" };

type PageAlert = {
  id: number;
  title: string;
  description: string;
  variant: "error" | "warning" | "info" | "success";
};

const emptyNumberPair = (): ModelPairNumbers => ({ model1: 0, model2: 0 });
const emptyErrorPair = (): ModelPairErrors => ({ model1: null, model2: null });
const emptyUsageSnapshot = (): UsageSnapshot => ({
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
});
const emptyUsagePair = (): UsagePair => ({
  model1: emptyUsageSnapshot(),
  model2: emptyUsageSnapshot(),
});

export default function Home() {
  const mockprompts = [
    "ask anything",
    "Explain quantum computing like I'm 10",
    "Summarize this meeting into action items",
    "Explain recursion using a real-world analogy"
  ];

  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [chats, setChats] = useState([{ id: 1, prompt: "", outputs: { model1: "", model2: "" } }]);
  const [activeChat, setActiveChat] = useState(1);
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [tokenCounts, setTokenCounts] = useState<{ [key: number]: ModelPairNumbers }>({
    1: emptyNumberPair()
  });
  const [tokensPerSecond, setTokensPerSecond] = useState<{ [key: number]: ModelPairNumbers }>({
    1: emptyNumberPair()
  });
  const [executionTimes, setExecutionTimes] = useState<{ [key: number]: ModelPairNumbers }>({
    1: emptyNumberPair()
  });
  const [timeToFirstByte, setTimeToFirstByte] = useState<{ [key: number]: ModelPairNumbers }>({
    1: emptyNumberPair()
  });
  const [usageDetails, setUsageDetails] = useState<{ [key: number]: UsagePair }>({
    1: emptyUsagePair()
  });
  const [modelErrors, setModelErrors] = useState<{ [key: number]: ModelPairErrors }>({
    1: emptyErrorPair()
  });
  const [alerts, setAlerts] = useState<PageAlert[]>([]);
  const alertIdRef = useRef(0);
  const alertTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const savedChats = localStorage.getItem("compare-chats-data");
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        if (parsed.chats && parsed.chats.length > 0) {
          const frameId = window.requestAnimationFrame(() => {
            setChats(parsed.chats);
            setActiveChat(parsed.activeChat || 1);
            if (parsed.tokenCounts) setTokenCounts(parsed.tokenCounts);
            if (parsed.tokensPerSecond) setTokensPerSecond(parsed.tokensPerSecond);
            if (parsed.executionTimes) setExecutionTimes(parsed.executionTimes);
            if (parsed.timeToFirstByte) setTimeToFirstByte(parsed.timeToFirstByte);
            if (parsed.usageDetails) setUsageDetails(parsed.usageDetails);
            if (parsed.modelErrors) setModelErrors(parsed.modelErrors);

            const current = parsed.chats.find((c: { id: number; prompt: string; outputs: { model1: string; model2: string } }) => c.id === (parsed.activeChat || 1));
            if (current) {
              setValue(current.prompt);
              if (current.outputs.model1 || current.outputs.model2) {
                setIsCompareMode(true);
              }
            }
          });

          return () => window.cancelAnimationFrame(frameId);
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
        pushAlert(
          "Saved chats could not be restored",
          "The stored conversation data was invalid, so the app started with a fresh state.",
          "warning",
        );
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      alertTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      alertTimeoutsRef.current.clear();
    };
  }, []);

  const removeAlert = useCallback((alertId: number) => {
    const timeoutId = alertTimeoutsRef.current.get(alertId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      alertTimeoutsRef.current.delete(alertId);
    }

    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  const pushAlert = useCallback(
    (title: string, description: string, variant: PageAlert["variant"] = "error") => {
      const id = ++alertIdRef.current;

      setAlerts((prev) => [
        {
          id,
          title,
          description,
          variant,
        },
        ...prev,
      ]);

      const timeoutId = setTimeout(() => {
        removeAlert(id);
      }, 4000);

      alertTimeoutsRef.current.set(id, timeoutId);
    },
    [removeAlert],
  );

  useEffect(() => {
    localStorage.setItem("compare-chats-data", JSON.stringify({
      chats,
      activeChat,
      tokenCounts,
      tokensPerSecond,
      executionTimes,
      timeToFirstByte,
      usageDetails,
      modelErrors,
    }));
  }, [chats, activeChat, tokenCounts, tokensPerSecond, executionTimes, timeToFirstByte, usageDetails, modelErrors]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gitCompareRef = useRef<{ startAnimation: () => void; stopAnimation: () => void }>(null);

  const { transcript, isListening, error: speechError, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (speechError) {
      pushAlert(
        "Speech recognition unavailable",
        speechError,
        "warning",
      );
    }
  }, [speechError, pushAlert]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prevIndex) => (prevIndex + 1) % mockprompts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [mockprompts.length]);

  const handleNewChat = useCallback(() => {
    setChats(prevChats => {
      const newChatId = prevChats.length > 0 ? Math.max(...prevChats.map(c => c.id)) + 1 : 1;

      setTokenCounts(prev => ({
        ...prev,
        [newChatId]: emptyNumberPair()
      }));
      setTokensPerSecond(prev => ({
        ...prev,
        [newChatId]: emptyNumberPair()
      }));
      setExecutionTimes(prev => ({
        ...prev,
        [newChatId]: emptyNumberPair()
      }));
      setTimeToFirstByte(prev => ({
        ...prev,
        [newChatId]: emptyNumberPair()
      }));
      setUsageDetails(prev => ({
        ...prev,
        [newChatId]: emptyUsagePair()
      }));
      setModelErrors(prev => ({
        ...prev,
        [newChatId]: emptyErrorPair()
      }));
      setActiveChat(newChatId);
      setValue("");
      setIsCompareMode(false);

      return [...prevChats, { id: newChatId, prompt: "", outputs: { model1: "", model2: "" } }];
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        setChats(currentChats => {
          if (currentChats.length <= 1) return currentChats;
          const currentIndex = currentChats.findIndex(c => c.id === activeChat);
          const newIndex = e.key === "ArrowRight"
            ? (currentIndex + 1) % currentChats.length
            : (currentIndex - 1 + currentChats.length) % currentChats.length;
          const nextChat = currentChats[newIndex];
          setActiveChat(nextChat.id);
          setValue(nextChat.prompt);
          return currentChats;
        });
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, startListening, stopListening, activeChat, handleNewChat]);

  const handleCompareClick = async () => {
    const currentPromptValue = isListening && transcript.trim() ? transcript : value;

    if (isComparing || !currentPromptValue.trim()) return;

    setIsCompareMode(true);
    setIsComparing(true);
    const chatId = activeChat;

    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, prompt: currentPromptValue, outputs: { model1: "", model2: "" } }
        : chat
    ));
    setTokenCounts(prev => ({
      ...prev,
      [chatId]: emptyNumberPair()
    }));
    setTokensPerSecond(prev => ({
      ...prev,
      [chatId]: emptyNumberPair()
    }));
    setExecutionTimes(prev => ({
      ...prev,
      [chatId]: emptyNumberPair()
    }));
    setTimeToFirstByte(prev => ({
      ...prev,
      [chatId]: emptyNumberPair()
    }));
    setUsageDetails(prev => ({
      ...prev,
      [chatId]: emptyUsagePair()
    }));
    setModelErrors(prev => ({
      ...prev,
      [chatId]: emptyErrorPair()
    }));

    try {
      const readStream = async (
        reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
        modelKey: "model1" | "model2",
      ) => {
        if (!reader) return;
        const decoder = new TextDecoder();
        const startTime = Date.now();
        let recordedFirstByte = false;
        let buffer = "";

        try {
          const processEvent = (event: StreamEvent) => {
            const elapsedSeconds = (Date.now() - startTime) / 1000;

            if (!recordedFirstByte) {
              setTimeToFirstByte(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyNumberPair()),
                  [modelKey]: Number(elapsedSeconds.toFixed(3))
                }
              }));
              recordedFirstByte = true;
            }

            if (event.type === "chunk") {
              setChats(prev => prev.map(chat =>
                chat.id === chatId
                  ? {
                      ...chat,
                      outputs: {
                        ...chat.outputs,
                        [modelKey]: chat.outputs[modelKey] + event.content
                      }
                    }
                  : chat
              ));
              setExecutionTimes(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyNumberPair()),
                  [modelKey]: Number(elapsedSeconds.toFixed(1))
                }
              }));
              return;
            }

            if (event.type === "usage") {
              setUsageDetails(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyUsagePair()),
                  [modelKey]: event.usage
                }
              }));
              setTokenCounts(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyNumberPair()),
                  [modelKey]: event.usage.completion_tokens
                }
              }));
              setTokensPerSecond(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyNumberPair()),
                  [modelKey]: Number(
                    (event.usage.completion_tokens / Math.max(elapsedSeconds, 0.001)).toFixed(1)
                  )
                }
              }));
              setExecutionTimes(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyNumberPair()),
                  [modelKey]: Number(elapsedSeconds.toFixed(1))
                }
              }));
              return;
            }

            if (event.type === "error") {
              const errorMessage = event.error.request_id
                ? `${event.error.message} (${event.error.code}; request ${event.error.request_id})`
                : `${event.error.message} (${event.error.code})`;

              setModelErrors(prev => ({
                ...prev,
                [chatId]: {
                  ...(prev[chatId] ?? emptyErrorPair()),
                  [modelKey]: errorMessage
                }
              }));

              pushAlert(
                `Model error: ${modelKey}`,
                errorMessage,
                "error",
              );
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              processEvent(JSON.parse(line) as StreamEvent);
            }
          }

          if (buffer.trim()) {
            processEvent(JSON.parse(buffer) as StreamEvent);
          }
        } catch (streamError) {
          console.error(`Stream interrupted for ${modelKey}:`, streamError);
          const message = "The response stream was interrupted before completion.";

          setModelErrors(prev => ({
            ...prev,
            [chatId]: {
              ...(prev[chatId] ?? emptyErrorPair()),
              [modelKey]: message
            }
          }));

          pushAlert(
            "Stream interrupted",
            `${modelKey} stopped early. Partial output was preserved.`,
            "warning",
          );
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
            const errorPayload = await res.json().catch(() => null) as
              | {
                  error?: {
                    message?: string;
                    code?: string;
                    request_id?: string;
                  };
                }
              | null;

            const message = errorPayload?.error?.request_id
              ? `${errorPayload.error.message} (${errorPayload.error.code}; request ${errorPayload.error.request_id})`
              : errorPayload?.error?.message
                ? `${errorPayload.error.message} (${errorPayload.error.code ?? "request_failed"})`
                : `HTTP error! status: ${res.status}`;

            throw new Error(message);
          }

          const reader = res.body?.getReader();
          await readStream(reader, modelKey);
        } catch (fetchError) {
          console.error(`Fetch failed for ${modelKey}:`, fetchError);
          const message = fetchError instanceof Error
            ? fetchError.message
            : "Failed to connect to the chat API.";

          setModelErrors(prev => ({
            ...prev,
            [chatId]: {
              ...(prev[chatId] ?? emptyErrorPair()),
              [modelKey]: message
            }
          }));

          pushAlert(
            `Model request failed: ${modelKey}`,
            message,
            "error",
          );
        }
      };

      await Promise.allSettled([
        fetchAndStream("sarvam-30b", "model1"),
        fetchAndStream("sarvam-105b", "model2")
      ]);
    } catch (error) {
      console.error("Unexpected error during compare operation:", error);
      pushAlert(
        "Unexpected compare error",
        "An unexpected issue interrupted the compare flow. The page stayed usable, but the current comparison may be incomplete.",
        "error",
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handleDeleteChat = (id: number) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        setTokenCounts({ 1: emptyNumberPair() });
        setTokensPerSecond({ 1: emptyNumberPair() });
        setExecutionTimes({ 1: emptyNumberPair() });
        setTimeToFirstByte({ 1: emptyNumberPair() });
        setUsageDetails({ 1: emptyUsagePair() });
        setModelErrors({ 1: emptyErrorPair() });
        setActiveChat(1);
        setValue("");
        setIsCompareMode(false);
        return [{ id: 1, prompt: "", outputs: { model1: "", model2: "" } }];
      }

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
    setTokenCounts({ 1: emptyNumberPair() });
    setTokensPerSecond({ 1: emptyNumberPair() });
    setExecutionTimes({ 1: emptyNumberPair() });
    setTimeToFirstByte({ 1: emptyNumberPair() });
    setUsageDetails({ 1: emptyUsagePair() });
    setModelErrors({ 1: emptyErrorPair() });
    setActiveChat(1);
    setValue("");
    setIsCompareMode(false);
    setIsComparing(false);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);
  const promptValue = isListening && transcript ? transcript : value;

  return (
    <main
      className={`flex min-h-screen flex-col items-center px-4 py-8 transition-colors duration-500 ${isCompareMode ? "justify-start bg-white" : "justify-center bg-[url('/background.png')] bg-cover bg-center"}`}
    >
      {alerts.length > 0 && (
        <div className="fixed left-4 right-4 top-4 z-50 flex max-w-2xl flex-col gap-3 md:left-1/2 md:right-auto md:w-full md:-translate-x-1/2">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.variant === "error" ? "error" : alert.variant === "warning" ? "warning" : alert.variant === "info" ? "info" : "success"}>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

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
          value={promptValue}
          setValue={setValue}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          isListening={isListening}
          isCompareMode={isCompareMode}
          hasPreviousChats={chats.some(chat => chat.outputs.model1 || chat.outputs.model2)}
          onSeePreviousChats={() => {
            const lastChatWithOutput = [...chats].reverse().find(c => c.outputs.model1 || c.outputs.model2);
            if (lastChatWithOutput) {
              const activeChatState = chats.find(chat => chat.id === activeChat);
              const isEmptyDraft =
                activeChatState &&
                !activeChatState.prompt.trim() &&
                !activeChatState.outputs.model1 &&
                !activeChatState.outputs.model2;

              if (isEmptyDraft && chats.length > 1) {
                setChats(prev => prev.filter(chat => chat.id !== activeChat));
              }

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
          stopListening={() => {
            if (transcript.trim()) {
              setValue(transcript);
            }
            stopListening();
          }}
          isComparing={isComparing}
        />

        {!isCompareMode && <ShortcutHints />}

        <OutputComparison
          isCompareMode={isCompareMode}
          currentChat={currentChat}
          tokenCounts={tokenCounts[activeChat] || emptyNumberPair()}
          tokensPerSecond={tokensPerSecond[activeChat] || emptyNumberPair()}
          executionTimes={executionTimes[activeChat] || emptyNumberPair()}
          timeToFirstByte={timeToFirstByte[activeChat] || emptyNumberPair()}
          modelErrors={modelErrors[activeChat] || emptyErrorPair()}
        />
      </motion.div>
    </main>
  );
}
