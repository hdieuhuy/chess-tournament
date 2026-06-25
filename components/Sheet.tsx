import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  // Prevent scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white dark:bg-slate-800 shadow-2xl sm:w-[600px] border-l border-zinc-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-slate-700 px-6 py-4">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-slate-100">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-600 dark:hover:text-slate-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-slate-800">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
