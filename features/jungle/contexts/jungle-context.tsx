"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BoardState, Move, JungleGameState, GamePhase } from "../types";
import { INITIAL_BOARD, INITIAL_TIME, isValidMove } from "../constants";

interface JungleContextType extends JungleGameState {
  roomId: string;
  playerName: string;
  isSpectator: boolean;
  gamePhase: GamePhase;
  selectedPos: [number, number] | null;

  handleCellClick: (r: number, c: number) => void;
  handleReady: () => void;
  handleResign: () => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2 | 3 | 4) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleChangeGameMode: (mode: "1v1" | "2v2") => void;
  handleTimeChange: (time: number) => void;
}

const JungleContext = createContext<JungleContextType | undefined>(undefined);

export function JungleProvider({
  children,
  roomId,
  playerName,
  requestedRole,
  isCreator,
  hasInitialized,
}: {
  children: ReactNode;
  roomId: string;
  playerName: string;
  requestedRole: "player" | "spectator";
  isCreator: boolean;
  hasInitialized: boolean;
}) {
  const router = useRouter();

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [isRedTurn, setIsRedTurn] = useState<boolean>(true);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [hostName, setHostName] = useState<string | null>(isCreator ? playerName : null);
  const [player1Name, setPlayer1Name] = useState<string | null>(isCreator ? playerName : null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [player3Name, setPlayer3Name] = useState<string | null>(null);
  const [player4Name, setPlayer4Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [initialTime, setInitialTime] = useState<number>(INITIAL_TIME);
  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);
  const [gameMode, setGameMode] = useState<"1v1" | "2v2">("1v1");

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isPlayer3 = playerName === player3Name;
  const isPlayer4 = playerName === player4Name;
  const isSpectator = spectators.includes(playerName);

  let gamePhase: GamePhase = "waiting";
  if (gameStarted) gamePhase = "playing";
  if (winner) gamePhase = "ended";

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isRedTurn,
    turnIndex,
    winner,
    lastMove,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
    gameMode,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      spectators,
      board,
      isRedTurn,
      turnIndex,
      winner,
      lastMove,
      history,
      undoRequestedBy,
      gameStarted,
      readyPlayers,
      player1Time,
      player2Time,
      initialTime,
      gameMode,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isRedTurn,
    turnIndex,
    winner,
    lastMove,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
    gameMode,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`jungle-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          board,
          isRedTurn,
          turnIndex,
          winner,
          lastMove,
          player1Time,
          player2Time,
          history: newHistory,
        } = payload.payload;
        setBoard(board);
        setIsRedTurn(isRedTurn);
        if (turnIndex !== undefined) setTurnIndex(turnIndex);
        setWinner(winner);
        setLastMove(lastMove);
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(player1Time);
        setPlayer2Time(player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsRedTurn(true);
        setTurnIndex(0);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setHistory([]);
        setUndoRequestedBy(null);
        setPlayer1Time(stateRef.current.initialTime);
        setPlayer2Time(stateRef.current.initialTime);
        setGameStarted(false);
        setReadyPlayers([]);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer],
        );
      })
      .on("broadcast", { event: "game-start" }, () => {
        setGameStarted(true);
        setPlayer1Time(stateRef.current.initialTime);
        setPlayer2Time(stateRef.current.initialTime);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newSpecs = [...state.spectators];
          const isAlreadyPlayer = [state.player1Name, state.player2Name, state.player3Name, state.player4Name].includes(newPlayer);
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              let joined = false;
              if (!state.player1Name) { setPlayer1Name(newPlayer); stateRef.current.player1Name = newPlayer; joined = true; }
              else if (!state.player2Name) { setPlayer2Name(newPlayer); stateRef.current.player2Name = newPlayer; joined = true; }
              else if (state.gameMode === "2v2" && !state.player3Name) { setPlayer3Name(newPlayer); stateRef.current.player3Name = newPlayer; joined = true; }
              else if (state.gameMode === "2v2" && !state.player4Name) { setPlayer4Name(newPlayer); stateRef.current.player4Name = newPlayer; joined = true; }

              if (!joined) {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Phòng đã đủ người chơi, vui lòng tham gia với tư cách Người xem!",
                  },
                });
                return;
              }
            } else {
              if (newSpecs.length < 10) {
                newSpecs.push(newPlayer);
                setSpectators(newSpecs);
                stateRef.current.spectators = newSpecs;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Phòng đã đầy người xem!",
                  },
                });
                return;
              }
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: {
              ...stateRef.current,
              spectators: stateRef.current.spectators,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        setPlayer3Name(data.player3Name);
        setPlayer4Name(data.player4Name);
        setSpectators(data.spectators);
        setBoard(data.board);
        setIsRedTurn(data.isRedTurn);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined) setUndoRequestedBy(data.undoRequestedBy);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.gameMode !== undefined) setGameMode(data.gameMode);
        if (data.initialTime !== undefined) setInitialTime(data.initialTime);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayer1Name((prev) => (prev === oldName ? newName : prev));
        setPlayer2Name((prev) => (prev === oldName ? newName : prev));
        setPlayer3Name((prev) => (prev === oldName ? newName : prev));
        setPlayer4Name((prev) => (prev === oldName ? newName : prev));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setReadyPlayers((prev) => prev.map((p) => (p === oldName ? newName : p)));
      })
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error(payload.payload.reason || "Không thể tham gia phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole, targetSlot } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player") {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            const newReadyPlayers = state.readyPlayers.filter((p) => p !== reqPlayer);

            let newP1 = state.player1Name === reqPlayer ? null : state.player1Name;
            let newP2 = state.player2Name === reqPlayer ? null : state.player2Name;
            let newP3 = state.player3Name === reqPlayer ? null : state.player3Name;
            let newP4 = state.player4Name === reqPlayer ? null : state.player4Name;

            let success = false;

            if (targetSlot === 1 && !newP1) { newP1 = reqPlayer; success = true; }
            else if (targetSlot === 2 && !newP2) { newP2 = reqPlayer; success = true; }
            else if (targetSlot === 3 && !newP3 && state.gameMode === "2v2") { newP3 = reqPlayer; success = true; }
            else if (targetSlot === 4 && !newP4 && state.gameMode === "2v2") { newP4 = reqPlayer; success = true; }

            if (success) {
              setPlayer1Name(newP1);
              setPlayer2Name(newP2);
              setPlayer3Name(newP3);
              setPlayer4Name(newP4);
              setSpectators(newSpecs);
              setReadyPlayers(newReadyPlayers);

              stateRef.current.player1Name = newP1;
              stateRef.current.player2Name = newP2;
              stateRef.current.player3Name = newP3;
              stateRef.current.player4Name = newP4;
              stateRef.current.spectators = newSpecs;
              stateRef.current.readyPlayers = newReadyPlayers;

              roomChannel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current },
              });
            }
          } else if (newRole === "spectator") {
            const newP1 = state.player1Name === reqPlayer ? null : state.player1Name;
            const newP2 = state.player2Name === reqPlayer ? null : state.player2Name;
            const newP3 = state.player3Name === reqPlayer ? null : state.player3Name;
            const newP4 = state.player4Name === reqPlayer ? null : state.player4Name;
            const newSpecs = [...state.spectators];
            if (!newSpecs.includes(reqPlayer)) {
              newSpecs.push(reqPlayer);
            }
            const newReadyPlayers = state.readyPlayers.filter((p) => p !== reqPlayer);

            setPlayer1Name(newP1);
            setPlayer2Name(newP2);
            setPlayer3Name(newP3);
            setPlayer4Name(newP4);
            setSpectators(newSpecs);
            setReadyPlayers(newReadyPlayers);

            stateRef.current.player1Name = newP1;
            stateRef.current.player2Name = newP2;
            stateRef.current.player3Name = newP3;
            stateRef.current.player4Name = newP4;
            stateRef.current.spectators = newSpecs;
            stateRef.current.readyPlayers = newReadyPlayers;

            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current },
            });
          }
        }
      })
      .on("broadcast", { event: "settings-change" }, (payload) => {
        const { gameMode, initialTime } = payload.payload;
        if (gameMode) {
          setGameMode(gameMode);
          if (gameMode === "1v1") {
            if (stateRef.current.player3Name) {
              setSpectators((prev) => [...prev, stateRef.current.player3Name!]);
              setPlayer3Name(null);
            }
            if (stateRef.current.player4Name) {
              setSpectators((prev) => [...prev, stateRef.current.player4Name!]);
              setPlayer4Name(null);
            }
          }
        }
        if (initialTime) {
          setInitialTime(initialTime);
          setPlayer1Time(initialTime);
          setPlayer2Time(initialTime);
        }
      })
      .on("broadcast", { event: "request-undo" }, (payload) => {
        setUndoRequestedBy(payload.payload.playerName);
      })
      .on("broadcast", { event: "reject-undo" }, () => {
        const state = stateRef.current;
        if (playerName === state.undoRequestedBy) {
          toast.error("Đối thủ đã từ chối yêu cầu đi lại.");
        }
        setUndoRequestedBy(null);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel.send({
            type: "broadcast",
            event: "request-join",
            payload: { playerName, requestedRole },
          });
        }
      });

    setChannel(roomChannel);
    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, playerName, hasInitialized, requestedRole, router]);

  useEffect(() => {
    if (gameStarted || !channel || !hostName) return;
    const requiredPlayers = gameMode === "1v1" ? [player1Name, player2Name] : [player1Name, player2Name, player3Name, player4Name];
    if (requiredPlayers.some(p => !p)) return;

    const allReady = requiredPlayers.every(p => readyPlayers.includes(p!));

    if (allReady) {
      if (playerName === hostName) {
        setGameStarted(true);
        setPlayer1Time(initialTime);
        setPlayer2Time(initialTime);
        channel.send({
          type: "broadcast",
          event: "game-start",
          payload: {},
        });
      }
    }
  }, [readyPlayers, player1Name, player2Name, player3Name, player4Name, gameStarted, playerName, hostName, channel, gameMode, initialTime]);

  // Timer logic
  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isRedTurn) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("b");
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "b", player1Time: 0 },
              });
            }
            clearInterval(timer);
            return 0;
          }
          return t - 1;
        });
      } else {
        setPlayer2Time((t) => {
          if (t <= 1) {
            setWinner("r");
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "r", player2Time: 0 },
              });
            }
            clearInterval(timer);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, winner, isRedTurn, channel, playerName, hostName]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator) return;

      const myColor = (isPlayer1 || isPlayer3) ? "r" : (isPlayer2 || isPlayer4) ? "b" : null;
      const currentTurn = isRedTurn ? "r" : "b";
      
      // In 2v2, enforce strictly turnIndex matching
      if (gameMode === "2v2") {
        if (turnIndex === 0 && !isPlayer1) return;
        if (turnIndex === 1 && !isPlayer2) return;
        if (turnIndex === 2 && !isPlayer3) return;
        if (turnIndex === 3 && !isPlayer4) return;
      } else {
        // In 1v1, just enforce color
        if (myColor !== currentTurn) return;
      }

      const piece = board[r][c];
      const isRedPiece = piece ? piece === piece.toUpperCase() : null;

      if (piece && ((myColor === "r" && isRedPiece) || (myColor === "b" && !isRedPiece))) {
        setSelectedPos([r, c]);
        return;
      }

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        if (isValidMove(board, fr, fc, r, c, currentTurn)) {
          const currentState = {
            board: stateRef.current.board,
            isRedTurn: stateRef.current.isRedTurn,
            turnIndex: stateRef.current.turnIndex,
            winner: stateRef.current.winner,
            lastMove: stateRef.current.lastMove,
            player1Time: stateRef.current.player1Time,
            player2Time: stateRef.current.player2Time,
          };
          const newHistory = [...stateRef.current.history, currentState];
          setHistory(newHistory);

          const newBoard = board.map((row) => [...row]);
          newBoard[r][c] = newBoard[fr][fc];
          newBoard[fr][fc] = null;

          let newWinner = null;
          // Win logic: enter opponent Den
          if (isRedTurn && r === 0 && c === 3) newWinner = "r";
          if (!isRedTurn && r === 8 && c === 3) newWinner = "b";

          const nextTurn = !isRedTurn;
          const nextTurnIndex = gameMode === "2v2" ? (turnIndex + 1) % 4 : (isRedTurn ? 1 : 0);

          setBoard(newBoard);
          setIsRedTurn(nextTurn);
          setTurnIndex(nextTurnIndex);
          setWinner(newWinner);
          setSelectedPos(null);
          setLastMove({ from: [fr, fc], to: [r, c] });

          if (channel) {
            channel.send({
              type: "broadcast",
              event: "sync-move",
              payload: {
                board: newBoard,
                isRedTurn: nextTurn,
                turnIndex: nextTurnIndex,
                winner: newWinner,
                lastMove: { from: [fr, fc], to: [r, c] },
                history: newHistory,
                player1Time,
                player2Time,
              },
            });
          }
        } else {
          setSelectedPos(null);
        }
      }
    },
    [board, isRedTurn, turnIndex, winner, channel, isPlayer1, isPlayer2, isPlayer3, isPlayer4, isSpectator, selectedPos, gameStarted, player1Time, player2Time, gameMode]
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsRedTurn(true);
    setTurnIndex(0);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlayer1Time(initialTime);
    setPlayer2Time(initialTime);
    if (channel) channel.send({ type: "broadcast", event: "reset-game" });
  };

  const handleChangeGameMode = (mode: "1v1" | "2v2") => {
    if (playerName !== hostName || gameStarted || !channel) return;
    setGameMode(mode);
    channel.send({
      type: "broadcast",
      event: "settings-change",
      payload: { gameMode: mode },
    });
  };

  const handleTimeChange = (time: number) => {
    if (playerName !== hostName || gameStarted || !channel) return;
    setInitialTime(time);
    setPlayer1Time(time);
    setPlayer2Time(time);
    channel.send({
      type: "broadcast",
      event: "settings-change",
      payload: { initialTime: time },
    });
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    
    const isPlaying = [player1Name, player2Name, player3Name, player4Name].includes(targetName) && gameStarted;
    if (isPlaying) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });
    
    const state = stateRef.current;
    let p1 = state.player1Name, p2 = state.player2Name, p3 = state.player3Name, p4 = state.player4Name;
    if (targetName === p1) p1 = null;
    if (targetName === p2) p2 = null;
    if (targetName === p3) p3 = null;
    if (targetName === p4) p4 = null;
    
    setPlayer1Name(p1);
    setPlayer2Name(p2);
    setPlayer3Name(p3);
    setPlayer4Name(p4);
    
    setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
    if (gameStarted) resetGame();
    
    setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: {
          ...stateRef.current,
          player1Name: p1,
          player2Name: p2,
          player3Name: p3,
          player4Name: p4,
          readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
        },
      });
    }, 50);

    if (spectators.includes(targetName)) {
      const newSpecs = spectators.filter((s) => s !== targetName);
      setSpectators(newSpecs);
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current, spectators: newSpecs },
      });
    }
  };

  const handleSlotClick = (targetSlot: 1 | 2 | 3 | 4) => {
    if (!channel || gameStarted) return;

    if (targetSlot === 1 && player1Name) return;
    if (targetSlot === 2 && player2Name) return;
    if (targetSlot === 3 && player3Name) return;
    if (targetSlot === 4 && player4Name) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newSpecs = state.spectators.filter((s) => s !== playerName);
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);
      let newP1 = state.player1Name === playerName ? null : state.player1Name;
      let newP2 = state.player2Name === playerName ? null : state.player2Name;
      let newP3 = state.player3Name === playerName ? null : state.player3Name;
      let newP4 = state.player4Name === playerName ? null : state.player4Name;

      let success = false;

      if (targetSlot === 1 && !newP1) { newP1 = playerName; success = true; }
      else if (targetSlot === 2 && !newP2) { newP2 = playerName; success = true; }
      else if (targetSlot === 3 && !newP3 && gameMode === "2v2") { newP3 = playerName; success = true; }
      else if (targetSlot === 4 && !newP4 && gameMode === "2v2") { newP4 = playerName; success = true; }

      if (success) {
        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setPlayer3Name(newP3);
        setPlayer4Name(newP4);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.player3Name = newP3;
        stateRef.current.player4Name = newP4;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReadyPlayers;

        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: { ...stateRef.current },
        });
      }
    } else {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player", targetSlot },
      });
    }
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "player");
  };

  const handleBecomeSpectator = () => {
    if (!channel || (gameStarted && !winner)) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newP1 = state.player1Name === playerName ? null : state.player1Name;
      const newP2 = state.player2Name === playerName ? null : state.player2Name;
      const newP3 = state.player3Name === playerName ? null : state.player3Name;
      const newP4 = state.player4Name === playerName ? null : state.player4Name;
      const newSpecs = [...state.spectators];
      if (!newSpecs.includes(playerName)) {
        newSpecs.push(playerName);
      }
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);

      setPlayer1Name(newP1);
      setPlayer2Name(newP2);
      setPlayer3Name(newP3);
      setPlayer4Name(newP4);
      setSpectators(newSpecs);
      setReadyPlayers(newReadyPlayers);

      stateRef.current.player1Name = newP1;
      stateRef.current.player2Name = newP2;
      stateRef.current.player3Name = newP3;
      stateRef.current.player4Name = newP4;
      stateRef.current.spectators = newSpecs;
      stateRef.current.readyPlayers = newReadyPlayers;

      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    } else {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "spectator" },
      });
    }
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "spectator");
  };

  const handleRequestUndo = () => {
    if (channel && !isSpectator) {
      setUndoRequestedBy(playerName);
      channel.send({
        type: "broadcast",
        event: "request-undo",
        payload: { playerName },
      });
    }
  };

  const handleAcceptUndo = () => {
    const state = stateRef.current;
    if (state.history.length > 0 && channel) {
      const prevState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      setBoard(prevState.board);
      setIsRedTurn(prevState.isRedTurn);
      setTurnIndex(prevState.turnIndex);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          ...prevState,
          history: newHistory,
        },
      });
    }
  };

  const handleRejectUndo = () => {
    setUndoRequestedBy(null);
    if (channel) channel.send({ type: "broadcast", event: "reject-undo", payload: {} });
  };

  const handleReady = () => {
    if (!playerName || readyPlayers.includes(playerName)) return;
    setReadyPlayers((prev) => [...prev, playerName]);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-ready",
        payload: { playerName },
      });
    }
  };

  const handleResign = () => {
    if (winner || !gameStarted || isSpectator) return;
    const myColor = (isPlayer1 || isPlayer3) ? "r" : (isPlayer2 || isPlayer4) ? "b" : null;
    if (!myColor) return;

    const newWinner = myColor === "r" ? "b" : "r";
    setWinner(newWinner);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: { ...stateRef.current, winner: newWinner },
      });
    }
  };

  const value: JungleContextType = {
    roomId,
    playerName,
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isRedTurn,
    turnIndex,
    winner,
    lastMove,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
    gameMode,
    isSpectator,
    gamePhase,
    selectedPos,

    handleCellClick,
    handleReady,
    handleResign,
    resetGame,
    handleKickPlayer,
    handleSlotClick,
    handleBecomeSpectator,
    handleRequestUndo,
    handleAcceptUndo,
    handleRejectUndo,
    handleChangeGameMode,
    handleTimeChange,
  };

  return <JungleContext.Provider value={value}>{children}</JungleContext.Provider>;
}

export function useJungle() {
  const context = useContext(JungleContext);
  if (context === undefined) {
    throw new Error("useJungle must be used within a JungleProvider");
  }
  return context;
}
