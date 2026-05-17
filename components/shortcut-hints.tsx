import { motion } from "motion/react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function ShortcutHints() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4 flex items-center justify-center gap-6 text-[12px] text-[#949494]"
    >
      <div className="flex items-center gap-2">
        <span>Text Input</span>
        <Kbd>/</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span>Voice Input</span>
        <div className="flex items-center gap-1">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>M</Kbd>
          </KbdGroup>
          <span>or</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>M</Kbd>
          </KbdGroup>
        </div>
      </div>
    </motion.div>
  );
}
