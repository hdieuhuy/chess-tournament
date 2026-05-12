"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { Role, ROLE_MAP } from "@/types/werewolf";
import { useWerewolfGame } from "@/hooks/useWerewolfGame";
import { PlayerGrid } from "@/components/werewolf/PlayerGrid";

function WerewolfGame() {
  const { state, derived, setters, actions } = useWerewolfGame();

  if (state.isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-8">
      {state.hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setters.setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
            title="Chỉnh sửa tên"
          >
            {state.playerName ? state.playerName.charAt(0).toUpperCase() : "👤"}
          </button>
        </div>
      )}

      <Modal
        isOpen={state.showNameModal}
        title={
          state.hasInitialized
            ? "Chỉnh sửa tên"
            : state.roomId
              ? "Tham gia phòng chơi"
              : "Tạo phòng chơi mới"
        }
      >
        <form
          onSubmit={actions.handleJoinRoom}
          className="flex flex-col space-y-4"
        >
          <input
            type="text"
            value={state.inputName}
            onChange={(e) => setters.setInputName(e.target.value)}
            placeholder="Nhập tên..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />
          {!state.hasInitialized && state.roomId && (
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="player"
                  checked={state.requestedRole === "player"}
                  onChange={(e) =>
                    setters.setRequestedRole(
                      e.target.value as "player" | "spectator",
                    )
                  }
                />
                <span>Người chơi</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="spectator"
                  checked={state.requestedRole === "spectator"}
                  onChange={(e) =>
                    setters.setRequestedRole(
                      e.target.value as "player" | "spectator",
                    )
                  }
                />
                <span>Người xem</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {state.hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      <div className="w-full max-w-[1400px] flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0 items-start">
        {/* Cột trái: Thông tin hiển thị & Các nút chức năng */}
        <div className="flex flex-col space-y-6 w-full">
          <h1 className="text-3xl font-light tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)] text-left">
            Ma Sói (Werewolf)
          </h1>
          {!state.showNameModal && (
            <div className="flex items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
              <span className="flex-1 select-all text-xs text-zinc-500">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setters.setLinkCopied(true);
                  setTimeout(() => setters.setLinkCopied(false), 2000);
                }}
                className="bg-black text-white text-xs px-3 py-1.5 rounded-md font-medium hover:bg-zinc-800"
              >
                {state.linkCopied ? "Đã copy!" : "Copy Link"}
              </button>
            </div>
          )}

          {/* Phase Information */}
          <div className="bg-white px-6 py-3 rounded-full border border-zinc-200 shadow-sm text-sm font-medium">
            {state.phase === "waiting" && (
              <span className="text-zinc-600">
                Đang chờ người chơi... (Đã có {state.players.length} người)
              </span>
            )}
            {state.phase === "night" && (
              <span className="text-indigo-800 font-bold animate-pulse">
                🌙 Đêm buông xuống - Các vai trò đang hành động
              </span>
            )}
            {state.phase === "day_discuss" && (
              <span className="text-amber-600 font-bold">
                ☀️ Ban ngày - Thảo luận tìm ra Sói
              </span>
            )}
            {state.phase === "day_vote" && (
              <span className="text-red-600 font-bold">
                ⚖️ Biểu quyết - Hãy chọn người bị treo cổ
              </span>
            )}
            {state.phase === "end" && (
              <span className="text-green-600 font-bold">
                🎉 Trò chơi kết thúc -{" "}
                {state.winner === "wolves" ? "SÓI THẮNG" : "DÂN LÀNG THẮNG"}
              </span>
            )}
          </div>

          {/* Extra Controls / Info */}
          <div className="flex flex-col items-start text-left bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4 w-full">
            {state.phase === "waiting" && (
              <div className="flex flex-col w-full space-y-4">
                <div className="flex flex-wrap justify-start gap-4">
                  {!derived.isSpectator && !derived.me?.isReady && (
                    <button
                      onClick={actions.handleReady}
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-full hover:bg-green-700"
                    >
                      Sẵn sàng
                    </button>
                  )}
                  {derived.isHost && (
                    <button
                      onClick={actions.handleStartGame}
                      className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Bắt đầu Game
                    </button>
                  )}
                </div>

                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 w-full mt-2">
                  <h3 className="font-semibold text-zinc-800 mb-3">
                    Cài đặt Vai trò (
                    {Object.values(state.roleCounts).reduce((a, b) => a + b, 0)}
                    /{state.players.length} người chơi)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(ROLE_MAP) as Role[]).map((role) => (
                      <div
                        key={role}
                        className="flex items-center justify-between bg-white p-3 rounded-md border border-zinc-200 shadow-sm"
                      >
                        <span className="text-sm font-medium">
                          {ROLE_MAP[role]}
                        </span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              actions.handleRoleCountChange(role, -1)
                            }
                            disabled={
                              !derived.isHost || state.roleCounts[role] === 0
                            }
                            className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-600 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm w-4 text-center font-semibold">
                            {state.roleCounts[role]}
                          </span>
                          <button
                            onClick={() =>
                              actions.handleRoleCountChange(role, 1)
                            }
                            disabled={!derived.isHost}
                            className="w-8 h-8 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-600 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {state.seerResult && state.phase === "night" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-left w-full max-w-md">
                Bạn soi <strong>{state.seerResult.name}</strong>. Vai trò là:{" "}
                <strong>{ROLE_MAP[state.seerResult.role]}</strong>.
              </div>
            )}

            {state.phase === "day_discuss" && derived.isHost && (
              <button
                onClick={actions.handleStartVoting}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-full hover:bg-red-700"
              >
                Kết thúc thảo luận & Bắt đầu biểu quyết
              </button>
            )}

            {state.phase === "day_vote" &&
              !derived.isDead &&
              !derived.isSpectator && (
                <button
                  onClick={() => actions.submitVote("skip")}
                  disabled={!!state.myVote}
                  className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 rounded-full text-zinc-800 font-medium transition-colors disabled:opacity-50"
                >
                  {state.myVote === "skip"
                    ? "Đã bỏ phiếu trắng"
                    : "Bỏ phiếu trắng (Skip)"}
                </button>
              )}

            {state.phase === "end" && derived.isHost && (
              <button
                onClick={actions.resetGame}
                className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800"
              >
                Chơi Ván Mới
              </button>
            )}

            <div className="pt-2 text-left text-xs text-zinc-400 border-t border-zinc-100 w-full">
              Có {state.spectators.length} người xem.{" "}
              <Link href="/" className="underline hover:text-zinc-600">
                Thoát ra trang chủ
              </Link>
            </div>
          </div>
        </div>{" "}
        {/* End Cột trái */}
        {/* Cột phải: Danh sách người chơi */}
        <div className="flex flex-col space-y-6 w-full">
          <h2 className="text-xl font-semibold text-zinc-900 text-left w-full">
            Người chơi
          </h2>
          <div className="w-full">
            <PlayerGrid
              players={state.players}
              playerName={state.playerName}
              hostName={state.hostName}
              phase={state.phase}
              me={derived.me}
              isDead={derived.isDead}
              isSpectator={derived.isSpectator}
              myAction={state.myAction}
              myVote={state.myVote}
              submitNightAction={actions.submitNightAction}
              submitVote={actions.submitVote}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function WerewolfPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <WerewolfGame />
    </Suspense>
  );
}
