import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  styleClassWrapper?: string;
  children: ReactNode;
}

export function Modal({
  isOpen,
  title,
  children,
  styleClassWrapper = "",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className={`w-full max-w-150 rounded-2xl bg-white p-6 shadow-2xl ${styleClassWrapper}`}
      >
        <h2 className="mb-4 text-center text-2xl font-semibold text-zinc-900 font-[family-name:var(--font-playfair)]">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
