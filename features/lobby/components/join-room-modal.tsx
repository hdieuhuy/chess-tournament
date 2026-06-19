import React, { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";

interface JoinRoomModalProps {
  isOpen: boolean;
  gameName: string;
  initialName: string;
  hasRoomId: boolean;
  requestedRole: "player" | "spectator";
  onRoleChange: (role: "player" | "spectator") => void;
  onSubmit: (name: string) => void;
}

export function JoinRoomModal({
  isOpen,
  gameName,
  initialName,
  hasRoomId,
  requestedRole,
  onRoleChange,
  onSubmit,
}: JoinRoomModalProps) {
  const [inputName, setInputName] = useState(initialName);

  useEffect(() => {
    setInputName(initialName);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      onSubmit(inputName.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Chào mừng đến với {gameName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full rounded-lg border-2 border-indigo-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
              maxLength={20}
              autoFocus
            />
          </div>
          {hasRoomId && (
            <div className="flex justify-center space-x-4 mb-4">
              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  checked={requestedRole === "player"}
                  onChange={() => onRoleChange("player")}
                  className="form-radio text-indigo-600"
                />
                <span>Người chơi</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  checked={requestedRole === "spectator"}
                  onChange={() => onRoleChange("spectator")}
                  className="form-radio text-indigo-600"
                />
                <span>Người xem</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            disabled={!inputName.trim()}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Vào phòng
          </button>
        </form>
      </div>
    </Modal>
  );
}
