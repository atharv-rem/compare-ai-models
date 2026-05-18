import { motion } from "motion/react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function ShortcutHints() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 hidden md:flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-[#595959] px-4"
    >
      <div className="flex items-center gap-2">
        <span>Prompt</span>
        <Kbd>/</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span>Submit</span>
        <KbdGroup>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center gap-2">
        <span>Voice</span>
        <div className="flex items-center gap-1">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>M</Kbd>
          </KbdGroup>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>New Chat</span>
        <div className="flex items-center gap-1">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>Switch Tabs</span>
        <div className="flex items-center gap-1">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>←</Kbd>
          </KbdGroup>
          <span>/</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>→</Kbd>
          </KbdGroup>
        </div>
      </div>
    </motion.div>
  );
}
