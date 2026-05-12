"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Modal } from "@/components/Modal";

const GAMES = [
  // {
  //   id: "werewolf",
  //   name: "Ma Sói",
  //   icon: "🐺",
  //   path: "/werewolf",
  //   desc: "Trò chơi suy luận",
  // },
  {
    id: "chess",
    name: "Cờ Vua",
    icon: "♚",
    path: "/chess",
    desc: "Game chiến thuật kinh điển",
  },
  {
    id: "xiangqi",
    name: "Cờ Tướng",
    icon: "車",
    path: "/xiangqi",
    desc: "Tinh hoa kỳ đạo phương Đông",
  },
  {
    id: "gomoku",
    name: "Cờ Caro",
    icon: "⭕",
    path: "/gomoku",
    desc: "Năm quân thẳng hàng là thắng",
  },
  {
    id: "go",
    name: "Cờ Vây",
    icon: "⚫",
    path: "/go",
    desc: "Nghệ thuật bao vây lãnh thổ",
  },
  {
    id: "battleship",
    name: "Bắn Thuyền",
    icon: "🚢",
    path: "/battleship",
    desc: "Dò tìm và đánh chìm hạm đội",
  },
];

export default function HomePage() {
  const [playerName, setPlayerName] = useState("");
  const [inputName, setInputName] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);
      setShowModal(false);
    }
    setIsChecking(false);
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const newName = inputName.trim();
    setPlayerName(newName);
    localStorage.setItem("playerName", newName);
    setShowModal(false);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12">
      {playerName && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
            title="Chỉnh sửa tên"
          >
            {playerName.charAt(0).toUpperCase()}
          </button>
        </div>
      )}

      <Modal isOpen={showModal} title="Chào mừng đến với BoardGame Portal">
        <form onSubmit={handleSaveName} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-500">
            Vui lòng nhập tên hiển thị của bạn trước khi chọn game.
          </p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {playerName ? "Cập nhật" : "Bắt đầu"}
          </button>
        </form>
      </Modal>

      <div className="w-full max-w-5xl flex flex-col items-center space-y-12">
        <div className="text-center space-y-4 mt-8">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="BoardGame Portal Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 font-[family-name:var(--font-fira-sans)]">
            BoardGame Portal
          </h1>
          <p className="text-zinc-500 text-base md:text-lg max-w-2xl mx-auto">
            Nền tảng giải trí nội bộ. Hãy chọn một trò chơi dưới đây để tạo
            phòng mới hoặc tham gia cùng bạn bè!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.path}
              className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-6xl mb-5 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm flex items-center justify-center">
                {game.icon}
              </span>
              <h2 className="text-2xl font-bold text-zinc-800 mb-2">
                {game.name}
              </h2>
              <p className="text-sm text-zinc-500 text-center">{game.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
