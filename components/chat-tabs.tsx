import { motion } from "motion/react";
import MessageCircleIcon from "./ui/chat-icon";

type Chat = {
  id: number;
  prompt: string;
  outputs: { model1: string; model2: string; };
}

type ChatTabsProps = {
  chats: Chat[];
  activeChat: number;
  setActiveChat: (id: number) => void;
  setValue: (value: string) => void;
}

export function ChatTabs({ chats, activeChat, setActiveChat, setValue }: ChatTabsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 mb-4 w-full overflow-x-auto scrollbar-hide py-1"
    >
      {chats.map((chat, index) => (
        <button key={chat.id}  onClick={() => {setActiveChat(chat.id); setValue(chat.prompt);}}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-all ${activeChat === chat.id ? 'bg-black text-white' : 'bg-white border-[1.5px] border-[#F5F5F5] hover:bg-[#F5F5F5]'}`}
        >
          <MessageCircleIcon size={14} />
          chat {index + 1}
        </button>
      ))}
    </motion.div>
  );
}
