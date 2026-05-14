import { useState } from "react";
import { GiWolfHead } from "react-icons/gi";
import { ChatMessage } from "./types";

type WolfChatProps = {
  wolfChat: ChatMessage[];
  playerName: string;
  alivePlayers: string[];
  onSendMessage: (msg: string) => void;
  isNight?: boolean;
};

export default function WolfChat({
  wolfChat,
  playerName,
  alivePlayers,
  onSendMessage,
  isNight,
}: WolfChatProps) {
  const [chatInput, setChatInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !alivePlayers.includes(playerName)) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div
      className={`flex h-[250px] flex-col rounded-xl border shadow-sm ${isNight ? "border-red-900/50 bg-red-950/30" : "border-red-200 bg-red-50"}`}
    >
      <div
        className={`flex items-center rounded-t-xl border-b p-3 ${isNight ? "border-red-900/50 bg-red-900/40 text-red-200" : "border-red-200 bg-red-100 text-red-900"}`}
      >
        <GiWolfHead className="mr-2 text-red-700" />
        <h3 className="text-sm font-bold">Kênh chat nội bộ Sói</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2">
        {wolfChat.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.playerName === playerName ? "items-end" : "items-start"}`}
          >
            <span className="mb-0.5 text-[10px] font-bold text-red-600/70">
              {msg.playerName}
            </span>
            <div
              className={`rounded-lg px-3 py-1.5 text-sm ${msg.playerName === playerName ? "bg-red-600 text-white" : isNight ? "bg-slate-700 text-red-200 border border-red-900/50" : "bg-white text-red-900 border border-red-200"}`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <div
        className={`rounded-b-xl border-t p-2 ${isNight ? "border-red-900/50 bg-slate-800" : "border-red-200 bg-white"}`}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              alivePlayers.includes(playerName)
                ? "Nhắn tin cho đồng bọn..."
                : "Bạn đã chết, không thể chat."
            }
            disabled={!alivePlayers.includes(playerName)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${isNight ? "border-red-900/50 bg-slate-700 text-slate-200 focus:ring-red-600" : "border-red-200 bg-white focus:ring-red-500"}`}
          />
          <button
            type="submit"
            disabled={!alivePlayers.includes(playerName) || !chatInput.trim()}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
