import React from 'react';
import { useExplodingKittens } from '../contexts/exploding-kittens-context';
import { Card } from './exploding-kittens-card';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { BsFillRocketFill } from 'react-icons/bs';
import { IoWarningOutline } from 'react-icons/io5';
import { FaGhost, FaCrown, FaCheckCircle, FaTimesCircle, FaPlay, FaArrowLeft, FaScroll, FaEye, FaArrowRight } from "react-icons/fa";
import { GiSwordClash } from "react-icons/gi";
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CardType } from '../types';
import { CARD_DEFINITIONS } from '../constants';
import { CardInstance } from '../types';

function Modal({ isOpen, children, onClose, title }: { isOpen: boolean; children: React.ReactNode; onClose?: () => void; title?: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white border border-zinc-200 p-6 shadow-2xl">
        {title && <h2 className="mb-4 text-center text-xl font-bold text-zinc-900">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function ExplodingKittensBoard() {
  const {
    actionLog, spectators, hostName, handleResetGame, handleStartGame, linkCopied, direction, getNextAlivePlayerIndexState, setLinkCopied,
    playerName, players, gameStarted, currentTurnIndex, winner, playerHands, drawPile, discardPile,
    deadPlayers, turnsLeft, isDefusing, drawnBomb, peekedCards, targetSelectMode, combo2Target,
    selectedHandCards, pendingComboCards, favorRequest, isShuffling, pendingAction, timeLeft,
    localEndTime, bombAlert, isAlteringFuture, alterCards, isPlacingImplodingKitten,
    handleDrawCard, handlePlaceBomb, handlePlaceImplodingKitten, handlePlaySelected, handlePlayNope,
    handlePlayCard, handleSelectTarget, handleGiveFavorCard, handleReorderHand,
    setSelectedHandCards, setPendingComboCards, setTargetSelectMode, setCombo2Target, setPeekedCards
  } = useExplodingKittens();

  const myHand = playerHands[playerName] || [];

  const { setActionLog, setAlterCards, setIsAlteringFuture, setDrawPile, channel, executeComboAction } = useExplodingKittens();
  const toggleCardSelection = (cardId: string) => {
    const isSelected = selectedHandCards.some((c) => c.id === cardId);
    if (isSelected) {
      setSelectedHandCards(selectedHandCards.filter((c) => c.id !== cardId));
    } else {
      const card = myHand.find((c) => c.id === cardId);
      if (card) setSelectedHandCards([...selectedHandCards, card]);
    }
  };

  // We need missing components from UI like Modal
  // I will just return the UI
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">

      {/* Modal Defuse Bomb */}
      <Modal isOpen={isDefusing} title="GỠ BOM THÀNH CÔNG">
        <form onSubmit={handlePlaceBomb} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-600">
            Bạn đã dùng lá Defuse! Giờ hãy chọn vị trí để giấu Mèo Nổ trở lại
            chồng bài rút (0 là trên cùng).
          </p>
          <input
            type="number"
            name="bombPosition"
            min={0}
            max={drawPile.length}
            defaultValue={0}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700"
          >
            Đặt Mèo Nổ
          </button>
        </form>
      </Modal>

      {/* Modal Place Imploding Kitten */}
      <Modal
        isOpen={isPlacingImplodingKitten}
        title="BẠN ĐÃ RÚT PHẢI MÈO NỔ SẬP!"
      >
        <form
          onSubmit={handlePlaceImplodingKitten}
          className="flex flex-col space-y-4"
        >
          <p className="text-center text-sm text-zinc-600">
            Bạn không bị nổ (lần này). Hãy đặt lá Mèo Nổ Sập này trở lại chồng
            bài ở bất kỳ đâu. Lá bài sẽ được lật ngửa, và người tiếp theo rút
            phải nó sẽ nổ tung!
          </p>
          <input
            type="number"
            name="bombPosition"
            min={0}
            max={drawPile.length}
            defaultValue={0}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-white font-medium hover:bg-purple-700"
          >
            Đặt Mèo Nổ Sập
          </button>
        </form>
      </Modal>

      {/* Modal See The Future */}
      <Modal isOpen={peekedCards !== null} title="Xem trước 3 lá bài">
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="flex justify-center gap-4">
            {peekedCards?.map((card, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="mb-2 text-xs font-bold text-zinc-500">
                  {i === 0 ? "Trên cùng" : `Thứ ${i + 1}`}
                </span>
                <Card
                  card={CARD_DEFINITIONS[card.type]}
                  variantIndex={card.variantIndex}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setPeekedCards(null)}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white font-medium hover:bg-zinc-800"
          >
            Đóng
          </button>
        </div>
      </Modal>

      {/* Modal Alter The Future */}
      <Modal isOpen={isAlteringFuture} title="Thay đổi tương lai">
        <div className="flex flex-col items-center space-y-6 py-4">
          <p className="text-sm text-zinc-600 text-center">
            Sắp xếp lại các lá bài (Bên trái là lá trên cùng). Sử dụng nút mũi
            tên để đổi vị trí, sau đó bấm Xác nhận.
          </p>
          <div className="flex justify-center gap-4 w-full overflow-x-auto pb-4">
            {alterCards.map((card, i) => (
              <motion.div
                key={card.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">
                  {i === 0 ? "Trên cùng" : `Thứ ${i + 1}`}
                </span>
                <Card
                  card={CARD_DEFINITIONS[card.type]}
                  variantIndex={card.variantIndex}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (i > 0) {
                        const newCards = [...alterCards];
                        [newCards[i - 1], newCards[i]] = [
                          newCards[i],
                          newCards[i - 1],
                        ];
                        setAlterCards(newCards);
                      }
                    }}
                    disabled={i === 0}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaArrowLeft />
                  </button>
                  <button
                    onClick={() => {
                      if (i < alterCards.length - 1) {
                        const newCards = [...alterCards];
                        [newCards[i + 1], newCards[i]] = [
                          newCards[i],
                          newCards[i + 1],
                        ];
                        setAlterCards(newCards);
                      }
                    }}
                    disabled={i === alterCards.length - 1}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => {
              const newDrawPile = [...drawPile];
              const count = alterCards.length;
              newDrawPile.splice(-count, count, ...[...alterCards].reverse());

              setIsAlteringFuture(false);
              setAlterCards([]);
              setDrawPile(newDrawPile);

              const newLog = [
                `${playerName} đã sắp xếp lại ${count} lá bài trên cùng.`,
                ...actionLog,
              ];
              setActionLog(newLog);

              if (channel) {
                channel.send({
                  type: "broadcast",
                  event: "sync-game",
                  payload: {
                    drawPile: newDrawPile,
                    actionLog: newLog,
                  },
                });
              }
            }}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 cursor-pointer"
          >
            Xác nhận sắp xếp
          </button>
        </div>
      </Modal>

      {/* Modal Favor / Targeted Attack */}
      <Modal
        isOpen={
          targetSelectMode === "favor" || targetSelectMode === "targeted-attack"
        }
        title={
          targetSelectMode === "favor"
            ? "Chọn mục tiêu xin bài"
            : "Chọn mục tiêu tấn công"
        }
      >
        <div className="flex flex-col space-y-2 py-4">
          {players
            .filter((p) => p !== playerName && !deadPlayers.includes(p))
            .map((p) => (
              <button
                key={p}
                onClick={() => handleSelectTarget(p)}
                className="w-full rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 text-zinc-800 font-medium hover:bg-zinc-200"
              >
                {targetSelectMode === "favor"
                  ? `Xin của ${p} (${playerHands[p]?.length || 0} lá)`
                  : `Tấn công ${p}`}
              </button>
            ))}
          {players.filter((p) => p !== playerName && !deadPlayers.includes(p))
            .length === 0 && (
              <p className="text-center text-sm text-zinc-500">
                Không còn ai sống để chọn!
              </p>
            )}
          <button
            onClick={() => setTargetSelectMode(null)}
            className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </div>
      </Modal>

      {/* Modal Combo 2 */}
      <Modal
        isOpen={targetSelectMode === "combo2"}
        title={
          combo2Target
            ? `Chọn lá bài của ${combo2Target}`
            : "Chọn mục tiêu cướp bài (Bộ Đôi)"
        }
      >
        <div className="flex flex-col space-y-2 py-4">
          {!combo2Target ? (
            <>
              {players
                .filter((p) => p !== playerName && !deadPlayers.includes(p))
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      if ((playerHands[p]?.length || 0) > 0) {
                        setCombo2Target(p);
                      } else {
                        toast.error("Người chơi này không có bài!");
                      }
                    }}
                    className="w-full rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 text-zinc-800 font-medium hover:bg-zinc-200"
                  >
                    Cướp ngẫu nhiên của {p} ({playerHands[p]?.length || 0} lá)
                  </button>
                ))}
              <button
                onClick={() => {
                  setTargetSelectMode(null);
                  setSelectedHandCards([]);
                  setPendingComboCards([]);
                  setCombo2Target(null);
                }}
                className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-zinc-600 mb-2">
                Bạn đang lấy 1 lá ngẫu nhiên từ {combo2Target}. Hãy chọn 1 lá:
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                {playerHands[combo2Target]?.map((cardInstance) => (
                  <div
                    key={cardInstance.id}
                    className="relative group cursor-pointer hover:-translate-y-2 transition-transform"
                  >
                    <Card
                      card={CARD_DEFINITIONS["exploding-kitten"]}
                      isFaceDown={true}
                      onClick={() =>
                        executeComboAction(
                          "combo2",
                          combo2Target,
                          null,
                          cardInstance.id,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCombo2Target(null)}
                className="mt-4 w-full rounded-lg bg-zinc-100 px-4 py-3 text-zinc-600 font-medium hover:bg-zinc-200"
              >
                Quay lại chọn người khác
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Combo 3 */}
      <Modal
        isOpen={targetSelectMode === "combo3"}
        title="Chỉ định lá bài muốn cướp (Bộ 3)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            executeComboAction(
              "combo3",
              fd.get("targetPlayer") as string,
              fd.get("cardType") as CardType,
              null,
            );
          }}
          className="flex flex-col space-y-4 py-4"
        >
          <label className="text-sm font-medium text-zinc-700">
            Chọn người chơi:
          </label>
          <select
            name="targetPlayer"
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
            required
          >
            <option value="">-- Chọn mục tiêu --</option>
            {players
              .filter((p) => p !== playerName && !deadPlayers.includes(p))
              .map((p) => (
                <option key={p} value={p}>
                  {p} ({playerHands[p]?.length || 0} lá)
                </option>
              ))}
          </select>
          <label className="text-sm font-medium text-zinc-700">
            Chọn lá bài muốn lấy:
          </label>
          <select
            name="cardType"
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
            required
          >
            <option value="">-- Chọn bài --</option>
            {Object.entries(CARD_DEFINITIONS)
              .filter(
                ([type]) =>
                  type !== "exploding-kitten" && type !== "imploding-kitten",
              )
              .map(([type, def]) => (
                <option key={type} value={type}>
                  {def.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700"
          >
            Xác nhận Cướp
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetSelectMode(null);
              setSelectedHandCards([]);
              setPendingComboCards([]);
              setCombo2Target(null);
            }}
            className="w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </form>
      </Modal>

      {/* Modal Combo 5 */}
      <Modal
        isOpen={targetSelectMode === "combo5"}
        title="Lấy lại bài từ Chồng bài bỏ (Bộ 5)"
      >
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
            {discardPile.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                Chồng bài bỏ hiện đang trống!
              </p>
            ) : (
              discardPile.map((cardInstance) => (
                <div
                  key={cardInstance.id}
                  className="relative group cursor-pointer hover:-translate-y-2 transition-transform"
                  onClick={() =>
                    executeComboAction("combo5", null, null, cardInstance.id)
                  }
                >
                  <Card
                    card={CARD_DEFINITIONS[cardInstance.type]}
                    variantIndex={cardInstance.variantIndex}
                  />
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setTargetSelectMode(null);
              setSelectedHandCards([]);
              setPendingComboCards([]);
              setCombo2Target(null);
            }}
            className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </div>
      </Modal>

      {/* Modal Give Favor Card */}
      <Modal
        isOpen={favorRequest !== null && favorRequest.to === playerName}
        title="Yêu cầu Favor"
      >
        <div className="flex flex-col space-y-4 py-4">
          <p className="text-center text-sm text-zinc-600">
            <span className="font-bold">{favorRequest?.from}</span> đã dùng lá
            Favor lên bạn. Hãy chọn 1 lá bài để đưa cho họ.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
            {myHand.map((cardInstance) => (
              <div key={cardInstance.id} className="relative group">
                <Card
                  card={CARD_DEFINITIONS[cardInstance.type]}
                  variantIndex={cardInstance.variantIndex}
                  onClick={() => handleGiveFavorCard(cardInstance)}
                  className="hover:-translate-y-2"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Thông báo cho người dùng Favor */}
      <Modal
        isOpen={favorRequest !== null && favorRequest.from === playerName}
        title="Đang chờ bài..."
      >
        <div className="flex flex-col space-y-4 py-8 items-center">
          <p className="text-center text-sm text-zinc-600">
            Đang chờ <span className="font-bold">{favorRequest?.to}</span> chọn
            bài để đưa cho bạn...
          </p>
          <div className="mt-4 text-3xl animate-bounce">⏳</div>
        </div>
      </Modal>

      <div className="flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center gap-6 px-2 md:px-6 mx-auto">

        {/* Cột giữa: Khu vực Game */}
        <div className="flex w-full flex-col items-center justify-center">
          {gameStarted ? (
            <div className="relative flex w-full max-w-7xl flex-col items-center justify-between min-h-[85vh] rounded-3xl border-4 border-red-500 bg-orange-100 p-4 sm:p-8 shadow-xl overflow-hidden">
              
              {/* Nope Action Overlay */}
              <AnimatePresence>
                {pendingAction && (
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 rounded-xl border-2 border-red-500 bg-white/95 px-6 py-4 shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <IoWarningOutline className="h-6 w-6 animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-800">
                          {pendingAction.player} muốn đánh{" "}
                          {CARD_DEFINITIONS[pendingAction.cardType as CardType]?.name || "bài"}
                        </span>
                        <span className="text-sm font-medium text-red-500">
                          Có ai muốn NOPE không? ({timeLeft}s)
                        </span>
                      </div>
                    </div>
                    {pendingAction.nopeCount > 0 && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                        Đã bị NOPE {pendingAction.nopeCount} lần!
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Opponents around the table */}
              {players
                .filter((p) => p !== playerName)
                .map((p, index, arr) => {
                  const isDead = deadPlayers.includes(p);
                  const isTurn = players[currentTurnIndex] === p;
                  let posClass = "";
                  if (arr.length === 1)
                    posClass = "top-4 left-1/2 -translate-x-1/2";
                  else if (arr.length === 2) {
                    if (index === 0)
                      posClass = "top-1/4 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-1/4 right-4 -translate-y-1/2";
                  } else if (arr.length === 3) {
                    if (index === 0)
                      posClass = "top-1/4 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-4 left-1/2 -translate-x-1/2";
                    if (index === 2)
                      posClass = "top-1/4 right-4 -translate-y-1/2";
                  } else if (arr.length === 4) {
                    if (index === 0)
                      posClass = "top-1/3 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-4 left-1/3 -translate-x-1/2";
                    if (index === 2)
                      posClass = "top-4 left-2/3 -translate-x-1/2";
                    if (index === 3)
                      posClass = "top-1/3 right-4 -translate-y-1/2";
                  }

                  return (
                    <div
                      key={p}
                      className={`absolute ${posClass} flex flex-col items-center rounded-xl border-2 bg-white px-4 py-2 shadow-md transition-all z-10 ${isTurn ? "border-red-500 ring-4 ring-red-200 scale-110" : "border-zinc-200"} ${isDead ? "opacity-40 grayscale" : ""}`}
                    >
                      <span className="text-sm font-bold text-zinc-800 whitespace-nowrap">
                        {p}{" "}
                        {isDead && (
                          <FaGhost className="inline-block ml-1 text-slate-500" />
                        )}
                      </span>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {isDead ? "Đã nổ" : `${playerHands[p]?.length || 0} lá`}
                      </span>
                      {isTurn && turnsLeft > 1 && !isDead && (
                        <span className="absolute -bottom-3 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce">
                          <GiSwordClash className="inline-block mr-1" /> Phải
                          rút: {turnsLeft}
                        </span>
                      )}
                    </div>
                  );
                })}

              {/* Khoảng trống cho các đối thủ ở trên */}
              <div className="h-16 sm:h-24 w-full shrink-0" />

              {winner && (
                <div className="absolute left-1/2 top-1/2 z-30 flex w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-2xl border-4 border-yellow-400 bg-yellow-100 p-8 text-center shadow-2xl">
                  <h2 className="text-3xl font-black tracking-widest text-yellow-700 drop-shadow-sm uppercase">
                    🏆 CHIẾN THẮNG!
                  </h2>
                  <div className="text-5xl font-black text-yellow-600 drop-shadow-md">
                    {winner}
                  </div>
                  {playerName === hostName && (
                    <button
                      onClick={handleResetGame}
                      className="mt-4 cursor-pointer rounded-xl bg-yellow-500 px-8 py-3 font-black text-white shadow-lg transition-transform hover:bg-yellow-600 active:scale-95 uppercase tracking-wider"
                    >
                      Chơi lại
                    </button>
                  )}
                </div>
              )}

              {/* Game board center (draw/discard piles) */}
              <div className="flex flex-col items-center gap-6 w-full z-0 my-auto">
                <div className="flex items-center gap-8 sm:gap-12">
                  <div className="flex flex-col items-center relative">
                    <div className="relative">
                      {/* Hiệu ứng các lá bài ảo bay ra khi Shuffle */}
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                              x: [0, -40, 0, -40, 0],
                              y: [0, 15, 0, 15, 0],
                              rotate: [0, -20, 0, -20, 0],
                              opacity: [0, 1, 1, 1, 0],
                            }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                              x: [0, 40, 0, 40, 0],
                              y: [0, 10, 0, 10, 0],
                              rotate: [0, 20, 0, 20, 0],
                              opacity: [0, 1, 1, 1, 0],
                            }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                              y: [0, -30, 0, -30, 0],
                              rotate: [0, 10, 0, 10, 0],
                              opacity: [0, 1, 1, 1, 0],
                            }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>

                      {/* Lá bài chính (chồng bài rút) */}
                      <motion.div
                        layoutId={drawPile.length > 0 ? drawPile[drawPile.length - 1].id : "empty-deck"}
                        animate={
                          isShuffling
                            ? {
                              y: [0, -10, 10, -10, 0],
                              scale: [1, 1.05, 1.05, 1.05, 1],
                              zIndex: 10,
                            }
                            : { zIndex: 10 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative z-10"
                      >
                        {drawPile.length > 0 &&
                          drawPile[drawPile.length - 1].isFaceUp ? (
                          <Card
                            card={
                              CARD_DEFINITIONS[
                              drawPile[drawPile.length - 1].type
                              ]
                            }
                            variantIndex={
                              drawPile[drawPile.length - 1].variantIndex
                            }
                            onClick={handleDrawCard}
                            className={
                              players[currentTurnIndex] === playerName &&
                                !winner
                                ? "ring-[6px] ring-red-500 animate-pulse cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                                : "opacity-90"
                            }
                          />
                        ) : (
                          <Card
                            card={CARD_DEFINITIONS["exploding-kitten"]}
                            isFaceDown={true}
                            onClick={handleDrawCard}
                            className={
                              players[currentTurnIndex] === playerName &&
                                !winner
                                ? "ring-[6px] ring-red-500 animate-pulse cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                                : "opacity-90"
                            }
                          />
                        )}
                      </motion.div>
                    </div>
                    <p className="mt-3 text-center text-sm font-bold text-zinc-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                      Rút bài ({drawPile.length})
                    </p>
                    {players[currentTurnIndex] === playerName &&
                      !winner &&
                      turnsLeft > 1 && (
                        <div className="absolute -bottom-10 whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md animate-bounce z-20">
                          <GiSwordClash className="inline-block mr-1" /> Phải
                          rút: {turnsLeft} lượt
                        </div>
                      )}
                  </div>
                  {discardPile.length > 0 && (
                    <div className="flex flex-col items-center">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          layoutId={discardPile[discardPile.length - 1].id}
                          key={discardPile[discardPile.length - 1].id}
                          initial={{
                            scale: 0.5,
                            opacity: 0,
                            x: -50,
                            rotate: -20,
                          }}
                          animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                          }}
                        >
                          <Card
                            card={
                              CARD_DEFINITIONS[
                              discardPile[discardPile.length - 1].type
                              ]
                            }
                            variantIndex={
                              discardPile[discardPile.length - 1].variantIndex
                            }
                          />
                        </motion.div>
                      </AnimatePresence>
                      <p className="mt-3 text-center text-sm font-bold text-zinc-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                        Bài bỏ
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="h-14 flex items-center justify-center my-4 z-30">
                <AnimatePresence>
                  {selectedHandCards.length > 0 && players[currentTurnIndex] === playerName && !winner && !pendingAction && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      onClick={handlePlaySelected}
                      className="rounded-full bg-blue-600 px-8 py-3 font-bold text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition-all"
                    >
                      Đánh {selectedHandCards.length} lá bài
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Current Player's Hand */}
              <div className={`mt-2 flex flex-col items-center w-full z-20 gap-y-2 sm:gap-y-4 ${myHand.length > 5 ? "max-w-[1200px]" : "max-w-[600px]"}`}>
                <Reorder.Group
                  axis="x"
                  values={myHand}
                  onReorder={handleReorderHand}
                  className="flex w-full flex-wrap justify-center -space-x-10 sm:-space-x-14 pb-6 px-2 transition-all duration-300"
                >
                  <AnimatePresence>
                    {myHand.map((cardInstance: CardInstance, idx: number) => {
                      const isSelected = selectedHandCards.some(
                        (c) => c.id === cardInstance.id,
                      );
                      const isNopeable =
                        pendingAction &&
                        cardInstance.type === "nope" &&
                        !deadPlayers.includes(playerName);

                      let cardClassName = `${players[currentTurnIndex] === playerName && !winner && cardInstance.type !== "defuse" && cardInstance.type !== "exploding-kitten" && cardInstance.type !== "imploding-kitten" ? "cursor-pointer" : "opacity-80 cursor-not-allowed"} ${isSelected ? "ring-[5px] ring-blue-500 -translate-y-8 shadow-2xl" : "hover:-translate-y-6 shadow-xl"}`;

                      if (isNopeable) {
                        cardClassName =
                          "cursor-pointer animate-pulse ring-[4px] ring-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] -translate-y-8 hover:-translate-y-12 transition-all duration-300";
                      } else if (pendingAction) {
                        cardClassName =
                          "opacity-40 cursor-not-allowed grayscale-[50%]";
                      }

                      return (
                        <Reorder.Item
                          value={cardInstance}
                          id={cardInstance.id}
                          key={cardInstance.id}
                          initial={{ opacity: 0, y: 50, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.2 },
                          }}
                          whileHover={{ zIndex: 40 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          className="relative list-none"
                          style={{
                            zIndex: isNopeable
                              ? 100
                              : isSelected
                                ? 50
                                : idx,
                          }}
                        >
                          <Card
                            card={CARD_DEFINITIONS[cardInstance.type]}
                            variantIndex={cardInstance.variantIndex}
                            onClick={() => {
                              if (isNopeable) {
                                handlePlayNope(cardInstance);
                              } else {
                                toggleCardSelection(cardInstance.id);
                              }
                            }}
                            className={cardClassName}
                          />
                        </Reorder.Item>
                      );
                    })}
                  </AnimatePresence>
                </Reorder.Group>
              </div>
            </div>
          ) : (
            <div className="flex w-full min-h-[60vh] items-center justify-center rounded-3xl border-4 border-red-500 bg-orange-100 shadow-xl">
              <div className="text-2xl font-black uppercase tracking-widest text-red-500/50">
                Lobby Mèo Nổ
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}