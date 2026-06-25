import React, { useState } from "react";
import Link from "next/link";
import { useChess } from "../contexts/chess-context";
import { Crown, Gamepad2, Eye, Users, PartyPopper, Undo2, Flag, RotateCcw, Link as LinkIcon, DoorOpen, History } from "lucide-react";

interface ChessSidebarProps {
  isDarkMode: boolean;
  onReady?: () => void;
}

export function ChessSidebar({ isDarkMode, onReady }: ChessSidebarProps) {
  const [activeTab, setActiveTab] = useState<"players" | "spectators">("players");
  const [linkCopied, setLinkCopied] = useState(false);

  const {
    gameMode,
    playerName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    hostName,
    gameStarted,
    winner,
    readyPlayers,
    displayState,
    turnIndex,
    history,
    spectators,
    isSpectator,
    handleKickPlayer,
    handleChangeGameMode,
    handleTimeChange,
    initialTime,
    handleStartClick,
    handleRequestUndo,
    handleResign,
    resetGame,
    setReviewIndex,
    undoRequestedBy,
    handleAcceptUndo,
    handleRejectUndo,
    handleSlotClick,
    handleBecomeSpectator,
  } = useChess();

  const handleStartReady = () => {
    handleStartClick();
    onReady?.();
  };

  const playersCount = gameMode === "1v1"
    ? [player1Name, player2Name].filter(Boolean).length
    : [player1Name, player2Name, player3Name, player4Name].filter(Boolean).length;

  const maxPlayers = gameMode === "1v1" ? 2 : 4;

  const canUndo = () => {
    if (isSpectator || history.length < 2) return false;
    const isPlayer1 = playerName === player1Name;
    const isPlayer2 = playerName === player2Name;
    // P1 and P3 are White, P2 and P4 are Black
    const requesterColor = (isPlayer1 || playerName === player3Name) ? "W" : (isPlayer2 || playerName === player4Name) ? "B" : null;
    if (!requesterColor) return false;
    const requesterTurn = requesterColor === "W"; // true if White

    if (displayState.isWhiteTurn !== requesterTurn) return false;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].isWhiteTurn === requesterTurn) return true;
    }
    return false;
  };

  const statusText = winner
    ? `Winner: ${winner === "W" ? (gameMode === "2v2" ? "Đội Trắng" : player1Name) : gameMode === "2v2" ? "Đội Đen" : player2Name}`
    : gameStarted
      ? `Đang chơi - Lượt: ${gameMode === "2v2"
        ? turnIndex === 0 ? player1Name : turnIndex === 1 ? player2Name : turnIndex === 2 ? player3Name : player4Name
        : displayState.isWhiteTurn ? player1Name : player2Name
      }`
      : "Đang chờ bắt đầu...";

  return (
    <div className={`flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>

      {/* Undo Request Popup Layer */}
      {undoRequestedBy && undoRequestedBy !== playerName && !isSpectator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className={`p-6 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4 border transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
            <p className={`mb-6 text-lg font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              <span className="font-bold text-purple-600">{undoRequestedBy}</span> muốn xin đi lại.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={handleAcceptUndo} className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer">Đồng ý</button>
              <button onClick={handleRejectUndo} className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer">Từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className={`flex flex-col p-4 border-b transition-colors ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
              Cờ Vua (Chess)
            </h1>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1.5 ${winner ? "text-green-500" : isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
              {winner && <PartyPopper className="w-3.5 h-3.5" />}
              {statusText}
            </p>
          </div>
        </div>

        {/* ACTION BAR (Top ToolBar) */}
        <div className="flex justify-between items-center w-full pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {gameStarted && !winner && !isSpectator && canUndo() && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleRequestUndo}
                  disabled={!!undoRequestedBy}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${isDarkMode ? "bg-purple-900/30 border-purple-800 text-purple-400 hover:bg-purple-900/50" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"}`}
                >
                  <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Xin đi lại
                </div>
              </div>
            )}
            {gameStarted && !winner && !isSpectator && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleResign}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`}
                >
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Bỏ cuộc
                </div>
              </div>
            )}
            {playerName === hostName && (
              <div className="relative group flex justify-center">
                <button
                  onClick={resetGame}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Chơi lại
                </div>
              </div>
            )}
            {winner && (
              <div className="relative group flex justify-center">
                <button
                  onClick={() => setReviewIndex(0)}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"}`}
                >
                  <History className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Xem lại
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative group flex justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-indigo-900/30 border-indigo-800 text-indigo-400 hover:bg-indigo-900/50" : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"}`}
              >
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                {linkCopied ? "Đã copy!" : "Copy Link Phòng"}
              </div>
            </div>
            <div className="relative group flex justify-center">
              <Link
                href="/"
                className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 flex items-center justify-center ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                Về Trang Chủ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className={`flex border-b transition-colors shrink-0 ${isDarkMode ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-white"}`}>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "players"
              ? isDarkMode ? "text-indigo-400 border-b-2 border-indigo-500" : "text-indigo-600 border-b-2 border-indigo-600"
              : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Phòng chơi</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-zinc-200 text-zinc-700"}`}>
            {playersCount}/{maxPlayers}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "spectators"
              ? isDarkMode ? "text-indigo-400 border-b-2 border-indigo-500" : "text-indigo-600 border-b-2 border-indigo-600"
              : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Eye className="w-4 h-4" />
          <span>Khán giả</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-zinc-200 text-zinc-700"}`}>
            {spectators.length}
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
        {/* TAB 1: NGƯỜI CHƠI & LOBBY */}
        {activeTab === "players" && (
          <div className="flex flex-col gap-5 h-full">
            {playerName === hostName && !gameStarted && (
              <div className={`p-3 rounded-xl border flex flex-col gap-3 transition-colors ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-white border-zinc-200 shadow-sm"}`}>
                <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>Cài đặt phòng:</span>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                    <input type="radio" name="inRoomGameMode" checked={gameMode === "1v1"} onChange={() => handleChangeGameMode("1v1")} className="accent-indigo-600" />
                    1 vs 1
                  </label>
                  <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                    <input type="radio" name="inRoomGameMode" checked={gameMode === "2v2"} onChange={() => handleChangeGameMode("2v2")} className="accent-indigo-600" />
                    2 vs 2
                  </label>
                </div>
                {/* Chess specific: Time limit */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>Thời gian mỗi bên:</span>
                  <div className="flex gap-4 items-center flex-wrap">
                    <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                      <input type="radio" name="inRoomTime" checked={initialTime === 600} onChange={() => handleTimeChange(600)} className="accent-indigo-600" />
                      10 Phút
                    </label>
                    <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                      <input type="radio" name="inRoomTime" checked={initialTime === 300} onChange={() => handleTimeChange(300)} className="accent-indigo-600" />
                      5 Phút
                    </label>
                    <div className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                      <input type="radio" name="inRoomTime" checked={initialTime !== 300 && initialTime !== 600} onChange={() => {}} className="accent-indigo-600" />
                      Khác:
                      <input 
                        type="number" 
                        min="1" 
                        max="60"
                        value={initialTime / 60}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) handleTimeChange(val * 60);
                        }}
                        className={`w-16 px-2 py-1 text-xs border rounded outline-none transition-colors ${isDarkMode ? "bg-slate-800 border-slate-600 text-slate-200 focus:border-indigo-500" : "bg-white border-zinc-300 text-zinc-800 focus:border-indigo-500"}`}
                      />
                      phút
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!gameStarted && (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>Bắt đầu trận đấu</span>
                  <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>{readyPlayers.length}/{maxPlayers} sẵn sàng</span>
                </div>
                <button
                  onClick={handleStartReady}
                  disabled={readyPlayers.includes(playerName || "") || isSpectator}
                  className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {readyPlayers.includes(playerName || "") ? "Đã sẵn sàng..." : "Sẵn sàng"}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Team White */}
              <div className="flex flex-col gap-2">
                <h4 className={`text-sm font-bold transition-colors flex items-center justify-between ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
                  Đội Trắng (Đi trước)
                  {!gameStarted && playerName !== hostName && <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>10 phút</span>}
                </h4>
                <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                  {player1Name ? (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors border shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-zinc-300 text-zinc-800"}`}>
                        {player1Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player1Name} {playerName === player1Name && "(Bạn)"}
                          </span>
                          {hostName === player1Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {!gameStarted && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player1Name) ? "text-green-500" : "text-zinc-400"}`}>
                            {readyPlayers.includes(player1Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                          </span>
                        )}
                      </div>
                      {playerName === hostName && player1Name !== hostName && (!gameStarted || winner) && (
                        <button onClick={() => handleKickPlayer(player1Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          Kick
                        </button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => handleSlotClick(1)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-200 border-slate-600 hover:border-slate-400" : "text-zinc-500 hover:text-zinc-800 border-zinc-300 hover:border-zinc-500"}`}>
                      + Ngồi vào ghế 1
                    </button>
                  )}
                </div>
                {gameMode === "2v2" && (
                  <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                    {player3Name ? (
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors border shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-zinc-300 text-zinc-800"}`}>
                          {player3Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                              {player3Name} {playerName === player3Name && "(Bạn)"}
                            </span>
                            {hostName === player3Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                          </div>
                          {!gameStarted && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player3Name) ? "text-green-500" : "text-zinc-400"}`}>
                              {readyPlayers.includes(player3Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                            </span>
                          )}
                        </div>
                        {playerName === hostName && player3Name !== hostName && (!gameStarted || winner) && (
                          <button onClick={() => handleKickPlayer(player3Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                            Kick
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleSlotClick(3)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-200 border-slate-600 hover:border-slate-400" : "text-zinc-500 hover:text-zinc-800 border-zinc-300 hover:border-zinc-500"}`}>
                        + Ngồi vào ghế 3
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Team Black */}
              <div className="flex flex-col gap-2 mt-2">
                <h4 className={`text-sm font-bold transition-colors flex items-center justify-between ${isDarkMode ? "text-slate-400" : "text-zinc-800"}`}>
                  Đội Đen (Đi sau)
                </h4>
                <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                  {player2Name ? (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-slate-900 text-white border border-slate-700" : "bg-zinc-800 text-white"}`}>
                        {player2Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player2Name} {playerName === player2Name && "(Bạn)"}
                          </span>
                          {hostName === player2Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {!gameStarted && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player2Name) ? "text-green-500" : "text-zinc-400"}`}>
                            {readyPlayers.includes(player2Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                          </span>
                        )}
                      </div>
                      {playerName === hostName && player2Name !== hostName && (!gameStarted || winner) && (
                        <button onClick={() => handleKickPlayer(player2Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          Kick
                        </button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => handleSlotClick(2)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                      + Ngồi vào ghế 2
                    </button>
                  )}
                </div>
                {gameMode === "2v2" && (
                  <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                    {player4Name ? (
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-slate-900 text-white border border-slate-700" : "bg-zinc-800 text-white"}`}>
                          {player4Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                              {player4Name} {playerName === player4Name && "(Bạn)"}
                            </span>
                            {hostName === player4Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                          </div>
                          {!gameStarted && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player4Name) ? "text-green-500" : "text-zinc-400"}`}>
                              {readyPlayers.includes(player4Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                            </span>
                          )}
                        </div>
                        {playerName === hostName && player4Name !== hostName && (!gameStarted || winner) && (
                          <button onClick={() => handleKickPlayer(player4Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                            Kick
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleSlotClick(4)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                        + Ngồi vào ghế 4
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isSpectator && (!gameStarted || winner) && (
              <button
                onClick={handleBecomeSpectator}
                className={`mt-auto text-sm font-medium transition-colors w-full text-center py-2.5 rounded-lg border ${isDarkMode ? "text-slate-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "text-zinc-600 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"}`}
              >
                Rời ghế, trở thành khán giả
              </button>
            )}
          </div>
        )}

        {/* TAB 2: KHÁN GIẢ */}
        {activeTab === "spectators" && (
          <div className="flex flex-col gap-2 h-full">
            {spectators.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Users className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                <p className={`text-sm font-medium transition-colors ${isDarkMode ? "text-slate-500" : "text-zinc-400"}`}>
                  Chưa có khán giả nào
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spectators.map((spec, idx) => (
                  <li key={idx} className={`group flex items-center justify-between space-x-3 rounded-xl border p-2 transition-all ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner transition-colors ${isDarkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700"}`}>
                        {spec.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`} title={spec}>
                        {spec} {playerName === spec && "(Bạn)"}
                      </span>
                    </div>
                    {playerName === hostName && spec !== hostName && (
                      <button onClick={() => handleKickPlayer(spec)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        Kick
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
