import { useState, useEffect, useRef } from "react";
import { GiWolfHead } from "react-icons/gi";
import { FaHeart, FaSun } from "react-icons/fa";
import { ChatMessage } from "../types";

type PrivateChatProps = {
  wolfChat: ChatMessage[];
  loversChat: ChatMessage[];
  generalChat: ChatMessage[];
  playerName: string;
  alivePlayers: string[];
  isWolf: boolean;
  isLover: boolean;
  phase: string;
  onSendWolfMessage: (msg: string) => void;
  onSendLoversMessage: (msg: string) => void;
  onSendGeneralMessage: (msg: string) => void;
  isNight?: boolean;
};

export default function PrivateChat({
  wolfChat,
  loversChat,
  generalChat,
  playerName,
  alivePlayers,
  isWolf,
  isLover,
  phase,
  onSendWolfMessage,
  onSendLoversMessage,
  onSendGeneralMessage,
  isNight,
}: PrivateChatProps) {
  const showGeneral = phase === "day";
  const [activeTab, setActiveTab] = useState<"wolf" | "lovers" | "general">(
    showGeneral ? "general" : isWolf ? "wolf" : isLover ? "lovers" : "general",
  );
  const [chatInput, setChatInput] = useState<string>("");

  useEffect(() => {
    if (showGeneral) setActiveTab("general");
    else if (isWolf) setActiveTab("wolf");
    else if (isLover) setActiveTab("lovers");
  }, [phase]);

  const currentChat =
    activeTab === "wolf" && isWolf
      ? wolfChat
      : activeTab === "lovers" && isLover
        ? loversChat
        : activeTab === "general" && showGeneral
          ? generalChat
          : [];

  // Phát âm thanh khi có tin nhắn mới từ người khác
  const prevChatLen = useRef(currentChat.length);
  useEffect(() => {
    if (currentChat.length > prevChatLen.current) {
      const msg = currentChat[0];
      if (msg && msg.playerName !== playerName) {
        try {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + 0.1,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch (e) {}
      }
    }
    prevChatLen.current = currentChat.length;
  }, [currentChat, playerName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !alivePlayers.includes(playerName)) return;

    if (activeTab === "wolf" && isWolf) {
      onSendWolfMessage(chatInput.trim());
    } else if (activeTab === "lovers" && isLover) {
      onSendLoversMessage(chatInput.trim());
    } else if (activeTab === "general" && showGeneral) {
      onSendGeneralMessage(chatInput.trim());
    }

    setChatInput("");
  };

  const canChat =
    alivePlayers.includes(playerName) &&
    ((activeTab === "wolf" && isWolf) ||
      (activeTab === "lovers" && isLover) ||
      (activeTab === "general" && showGeneral));

  return (
    <div
      className={`flex h-[250px] flex-col rounded-xl border shadow-sm ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
    >
      <div
        className={`flex border-b overflow-hidden rounded-t-xl ${isNight ? "border-slate-700" : "border-zinc-200"}`}
      >
        {showGeneral && (
          <button
            onClick={() => setActiveTab("general")}
            className={`flex flex-1 items-center justify-center p-3 text-sm font-bold transition-colors ${activeTab === "general" ? (isNight ? "bg-amber-900/40 text-amber-500" : "bg-amber-50 text-amber-600") : isNight ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
          >
            <FaSun className="mr-2 text-amber-500" /> Làng
          </button>
        )}
        {isWolf && (
          <button
            onClick={() => setActiveTab("wolf")}
            className={`flex flex-1 items-center justify-center p-3 text-sm font-bold transition-colors ${activeTab === "wolf" ? (isNight ? "bg-red-900/40 text-red-200" : "bg-red-100 text-red-900") : isNight ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
          >
            <GiWolfHead className="mr-2 text-red-700" /> Sói
          </button>
        )}
        {isLover && (
          <button
            onClick={() => setActiveTab("lovers")}
            className={`flex flex-1 items-center justify-center p-3 text-sm font-bold transition-colors ${activeTab === "lovers" ? (isNight ? "bg-pink-900/40 text-pink-200" : "bg-pink-100 text-pink-900") : isNight ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
          >
            <FaHeart className="mr-2 text-pink-500" /> Cặp đôi
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2">
        {currentChat.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.playerName === playerName ? "items-end" : "items-start"}`}
          >
            <span
              className={`mb-0.5 text-[10px] font-bold ${activeTab === "wolf" ? "text-red-600/70" : activeTab === "lovers" ? "text-pink-600/70" : "text-amber-600/70"}`}
            >
              {msg.playerName}
            </span>
            <div
              className={`rounded-lg px-3 py-1.5 text-sm ${msg.playerName === playerName ? (activeTab === "wolf" ? "bg-red-600 text-white" : activeTab === "lovers" ? "bg-pink-500 text-white" : "bg-amber-600 text-white") : isNight ? (activeTab === "wolf" ? "bg-slate-700 text-red-200 border border-red-900/50" : activeTab === "lovers" ? "bg-slate-700 text-pink-200 border border-pink-900/50" : "bg-slate-700 text-amber-200 border border-amber-900/50") : activeTab === "wolf" ? "bg-white text-red-900 border border-red-200" : activeTab === "lovers" ? "bg-white text-pink-900 border border-pink-200" : "bg-white text-amber-900 border border-amber-200"}`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <div
        className={`rounded-b-xl border-t p-2 ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              canChat
                ? activeTab === "wolf"
                  ? "Nhắn tin cho đồng bọn..."
                  : activeTab === "lovers"
                    ? "Nhắn tin cho người ấy..."
                    : "Thảo luận cùng cả làng..."
                : "Bạn không thể chat."
            }
            disabled={!canChat}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${isNight ? "border-slate-600 bg-slate-700 text-slate-200" + (activeTab === "wolf" ? " focus:ring-red-600" : activeTab === "lovers" ? " focus:ring-pink-500" : " focus:ring-amber-500") : "border-zinc-200 bg-white" + (activeTab === "wolf" ? " focus:ring-red-500" : activeTab === "lovers" ? " focus:ring-pink-500" : " focus:ring-amber-500")}`}
          />
          <button
            type="submit"
            disabled={!canChat || !chatInput.trim()}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${activeTab === "wolf" ? "bg-red-600 hover:bg-red-700" : activeTab === "lovers" ? "bg-pink-500 hover:bg-pink-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
