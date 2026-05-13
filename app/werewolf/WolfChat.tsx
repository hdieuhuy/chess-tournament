import { useState } from "react";
import { GiWolfHead } from "react-icons/gi";
import { ChatMessage } from "./types";

type WolfChatProps = {
  wolfChat: ChatMessage[];
  playerName: string;
  alivePlayers: string[];
  onSendMessage: (msg: string) => void;
};

export default function WolfChat({
  wolfChat,
  playerName,
  alivePlayers,
  onSendMessage,
}: WolfChatProps) {
  const [chatInput, setChatInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !alivePlayers.includes(playerName)) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="flex h-[250px] flex-col rounded-xl border border-red-200 bg-red-50 shadow-sm">
      <div className="flex items-center rounded-t-xl border-b border-red-200 bg-red-100 p-3">
        <GiWolfHead className="mr-2 text-red-700" />
        <h3 className="text-sm font-bold text-red-900">Kênh chat nội bộ Sói</h3>
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
              className={`rounded-lg px-3 py-1.5 text-sm ${msg.playerName === playerName ? "bg-red-600 text-white" : "bg-white text-red-900 border border-red-200"}`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-b-xl border-t border-red-200 bg-white p-2">
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
            className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
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
