import { motion } from "motion/react";
import MessageCircleIcon from "./ui/chat-icon";
import { X, Trash2 } from "lucide-react";

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
  onDeleteChat: (id: number) => void;
  onClearAll: () => void;
}

export function ChatTabs({ chats, activeChat, setActiveChat, setValue, onDeleteChat, onClearAll }: ChatTabsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 mb-4 w-full overflow-x-auto scrollbar-hide py-1"
    >
      <div className="flex gap-2 flex-grow overflow-x-auto scrollbar-hide">
        {chats.map((chat, index) => (
          <div key={chat.id} className="relative group flex-shrink-0">
            <button 
              onClick={() => {setActiveChat(chat.id); setValue(chat.prompt);}}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none transition-all ${activeChat === chat.id ? 'bg-black text-white' : 'bg-white border-[1.5px] border-[#F5F5F5] hover:bg-[#F5F5F5]'}`}
            >
              <MessageCircleIcon size={14} />
              chat {index + 1}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600 shadow-sm z-10"
              title="Delete chat"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={onClearAll}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
        title="Clear all chats"
      >
        <Trash2 size={13} />
        <span className="hidden sm:inline">Clear All</span>
      </button>
    </motion.div>
  );
}
