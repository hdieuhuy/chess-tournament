"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";

const BOARD_SIZE = 19;
const INITIAL_TIME = 1800; // Thời gian thi đấu: 30 phút mỗi người
const KOMI = 7.5; // Điểm chấp (Komi) theo luật tính đất Trung Quốc (Area Scoring)

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

// Hàm nén trạng thái bàn cờ để lưu lịch sử (Kiểm tra Superko)
const serializeBoard = (b: (string | null)[][]) => {
  return b.map((row) => row.map((cell) => cell || ".").join("")).join("");
};

// Helper SVG Grid
const X = (c: number) => `${(c + 0.5) * (100 / BOARD_SIZE)}%`;
const Y = (r: number) => `${(r + 0.5) * (100 / BOARD_SIZE)}%`;

function GoGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [boardHistory, setBoardHistory] = useState<string[]>([]);
  const [isBlackNext, setIsBlackNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [captures, setCaptures] = useState<{ B: number; W: number }>({
    B: 0,
    W: 0,
  });
  const [passCount, setPassCount] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<{
    black: number;
    white: number;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);

  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);

      if (!roomParam) {
        setShowNameModal(false);
        setHasInitialized(true);
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setHostName(savedName);
        setPlayer1Name(savedName);
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        const joinedRole = localStorage.getItem(`joinedRoom_${roomParam}`);
        if (joinedRole) {
          setRequestedRole(joinedRole as "player" | "spectator");
          setShowNameModal(false);
          setHasInitialized(true);
        }
      }
    }
    setIsCheckingStorage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    boardHistory,
    isBlackNext,
    winner,
    lastMove,
    captures,
    passCount,
    finalScore,
    history,
    undoRequestedBy,
    player1Time,
    player2Time,
    gameStarted,
    readyPlayers,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      boardHistory,
      isBlackNext,
      winner,
      lastMove,
      captures,
      passCount,
      finalScore,
      history,
      undoRequestedBy,
      player1Time,
      player2Time,
      gameStarted,
      readyPlayers,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    boardHistory,
    isBlackNext,
    winner,
    lastMove,
    captures,
    passCount,
    finalScore,
    history,
    undoRequestedBy,
    player1Time,
    player2Time,
    gameStarted,
    readyPlayers,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`go-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const data = payload.payload;
        setBoard(data.board);
        setIsBlackNext(data.isBlackNext);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.captures) setCaptures(data.captures);
        if (data.passCount !== undefined) setPassCount(data.passCount);
        if (data.boardHistory) setBoardHistory(data.boardHistory);
        if (data.history) setHistory(data.history);
        setUndoRequestedBy(null);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.finalScore) setFinalScore(data.finalScore);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(createEmptyBoard());
        setIsBlackNext(true);
        setWinner(null);
        setLastMove(null);
        setCaptures({ B: 0, W: 0 });
        setPassCount(0);
        setBoardHistory([]);
        setFinalScore(null);
        setHistory([]);
        setUndoRequestedBy(null);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
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
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer =
            newPlayer === state.player1Name || newPlayer === newP2;
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (!state.player1Name) {
                setPlayer1Name(newPlayer);
                stateRef.current.player1Name = newPlayer;
              } else if (!newP2) {
                newP2 = newPlayer;
                setPlayer2Name(newP2);
                stateRef.current.player2Name = newP2;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Phòng đã đủ 2 người chơi!",
                  },
                });
                return;
              }
            } else {
              if (newSpecs.length < 5) {
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
              player2Name: newP2,
              spectators: newSpecs,
              readyPlayers: [],
              history: state.history,
              undoRequestedBy: state.undoRequestedBy,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        setSpectators(data.spectators);
        setBoard(data.board);
        setIsBlackNext(data.isBlackNext);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.captures) setCaptures(data.captures);
        if (data.passCount !== undefined) setPassCount(data.passCount);
        if (data.boardHistory) setBoardHistory(data.boardHistory);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined)
          setUndoRequestedBy(data.undoRequestedBy);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.finalScore) setFinalScore(data.finalScore);
        if (data.gameStarted) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayer1Name((prev) => (prev === oldName ? newName : prev));
        setPlayer2Name((prev) => (prev === oldName ? newName : prev));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setReadyPlayers((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
      })
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          alert(payload.payload.reason || "Không thể tham gia phòng!");
          setHasInitialized(false);
          setShowNameModal(true);
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
        }
      })
      .on("broadcast", { event: "leave-room" }, (payload) => {
        const state = stateRef.current;
        const leavingPlayer = payload.payload.playerName;

        let newP1 = state.player1Name;
        let newP2 = state.player2Name;
        if (newP1 === leavingPlayer) newP1 = null;
        if (newP2 === leavingPlayer) newP2 = null;

        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);
        const newReadyPlayers = state.readyPlayers.filter(
          (p) => p !== leavingPlayer,
        );

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newP1 || newP2 || newSpecs[0] || null;
        }

        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);
        setHostName(newHostName);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReadyPlayers;
        stateRef.current.hostName = newHostName;

        if (newHostName === playerName) {
          setTimeout(() => {
            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current },
            });
          }, 50);
        }
      })
      .on("broadcast", { event: "request-undo" }, (payload) => {
        setUndoRequestedBy(payload.payload.playerName);
      })
      .on("broadcast", { event: "reject-undo" }, () => {
        const state = stateRef.current;
        if (playerName === state.undoRequestedBy) {
          alert("Đối thủ đã từ chối yêu cầu đi lại.");
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
  }, [roomId, playerName, hasInitialized, requestedRole]);

  const channelRef = useRef(channel);
  const playerNameRef = useRef(playerName);
  useEffect(() => {
    channelRef.current = channel;
    playerNameRef.current = playerName;
  }, [channel, playerName]);

  useEffect(() => {
    const handleUnload = () => {
      if (channelRef.current && playerNameRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "leave-room",
          payload: { playerName: playerNameRef.current },
        });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  useEffect(() => {
    if (gameStarted || !player1Name || !player2Name || !channel) return;
    const p1Ready = readyPlayers.includes(player1Name);
    const p2Ready = readyPlayers.includes(player2Name);

    if (p1Ready && p2Ready) {
      if (playerName === hostName) {
        setGameStarted(true);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
        channel.send({
          type: "broadcast",
          event: "game-start",
          payload: {},
        });
      }
    }
  }, [
    readyPlayers,
    player1Name,
    player2Name,
    gameStarted,
    playerName,
    hostName,
    channel,
  ]);

  // Chess-style Timer Effect
  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isBlackNext) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("W"); // White wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "W", player1Time: 0 },
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
            setWinner("B"); // Black wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "B", player2Time: 0 },
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
  }, [gameStarted, winner, isBlackNext, channel, playerName, hostName]);

  useEffect(() => {
    if (winner === "B" || winner === "W") {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          zIndex: 9999,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          zIndex: 9999,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [winner]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const newName = inputName.trim();
    setPlayerName(newName);
    localStorage.setItem("playerName", newName);

    if (roomId) {
      localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
    }

    setShowNameModal(false);

    if (!hasInitialized) {
      setHasInitialized(true);
      if (!roomId) {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setHostName(newName);
        setPlayer1Name(newName);
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        router.replace(`${pathname}?room=${newRoomId}`);
      }
    } else {
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "update-name",
          payload: { oldName: playerName, newName: newName },
        });
      }
      if (hostName === playerName) setHostName(newName);
      if (player1Name === playerName) setPlayer1Name(newName);
      if (player2Name === playerName) setPlayer2Name(newName);
      if (spectators.includes(playerName)) {
        setSpectators(spectators.map((s) => (s === playerName ? newName : s)));
      }
    }
  };

  // Logic Flood Fill tìm số khí (liberties) và các quân cùng nhóm
  const getGroupAndLiberties = (
    currentBoard: (string | null)[][],
    startR: number,
    startC: number,
    color: string,
  ) => {
    const group: [number, number][] = [];
    let liberties = 0;
    const visited = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(false),
    );
    const queue = [[startR, startC]];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      group.push([r, c]);

      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (!visited[nr][nc]) {
            if (currentBoard[nr][nc] === null) {
              liberties++;
              visited[nr][nc] = true; // Chỉ đếm mỗi khí 1 lần
            } else if (currentBoard[nr][nc] === color) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
    return { group, liberties };
  };

  // Area Scoring (Luật đếm đất Trung Quốc)
  const calculateAreaScore = (finalBoard: (string | null)[][]) => {
    let blackScore = 0;
    let whiteScore = KOMI;

    const visited = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(false),
    );

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (visited[r][c]) continue;

        if (finalBoard[r][c] === "B") {
          blackScore++;
          visited[r][c] = true;
        } else if (finalBoard[r][c] === "W") {
          whiteScore++;
          visited[r][c] = true;
        } else {
          // Đếm vùng đất trống
          const emptyGroup: [number, number][] = [];
          const queue: [number, number][] = [[r, c]];
          visited[r][c] = true;
          let reachesBlack = false;
          let reachesWhite = false;

          while (queue.length > 0) {
            const [cr, cc] = queue.shift()!;
            emptyGroup.push([cr, cc]);

            const neighbors = [
              [cr - 1, cc],
              [cr + 1, cc],
              [cr, cc - 1],
              [cr, cc + 1],
            ];
            for (const [nr, nc] of neighbors) {
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (finalBoard[nr][nc] === "B") reachesBlack = true;
                else if (finalBoard[nr][nc] === "W") reachesWhite = true;
                else if (!visited[nr][nc]) {
                  visited[nr][nc] = true;
                  queue.push([nr, nc]);
                }
              }
            }
          }

          if (reachesBlack && !reachesWhite) {
            blackScore += emptyGroup.length;
          } else if (reachesWhite && !reachesBlack) {
            whiteScore += emptyGroup.length;
          }
        }
      }
    }
    return { blackScore, whiteScore };
  };

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (board[row][col] || winner || !gameStarted || isSpectator) return;

      const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
      const currentTurnColor = isBlackNext ? "B" : "W";

      if (myColor !== currentTurnColor) return;

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = currentTurnColor;

      const opponentColor = currentTurnColor === "B" ? "W" : "B";
      let capturedStones = 0;

      // 1. Kiểm tra ăn quân đối phương
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (newBoard[nr][nc] === opponentColor) {
            const { group, liberties } = getGroupAndLiberties(
              newBoard,
              nr,
              nc,
              opponentColor,
            );
            if (liberties === 0) {
              group.forEach(([gr, gc]) => {
                newBoard[gr][gc] = null;
                capturedStones++;
              });
            }
          }
        }
      }

      // 2. Kiểm tra cấm tự sát
      const { liberties } = getGroupAndLiberties(
        newBoard,
        row,
        col,
        currentTurnColor,
      );
      if (liberties === 0) {
        alert("Luật cấm tự sát: Không thể đánh vào ô không còn khí!");
        return;
      }

      // 3. Kiểm tra Positional Superko (Cấm lặp lại trạng thái cũ)
      const serializedBoard = serializeBoard(newBoard);
      if (boardHistory.includes(serializedBoard)) {
        alert(
          "Luật Superko: Nước đi này làm bàn cờ lặp lại cục diện cũ (Kiếp)!",
        );
        return;
      }

      // Đã hợp lệ, tiến hành lưu lịch sử đi lại (undo)
      const currentState = {
        board: stateRef.current.board,
        isBlackNext: stateRef.current.isBlackNext,
        winner: stateRef.current.winner,
        lastMove: stateRef.current.lastMove,
        captures: stateRef.current.captures,
        passCount: stateRef.current.passCount,
        boardHistory: stateRef.current.boardHistory,
        player1Time: stateRef.current.player1Time,
        player2Time: stateRef.current.player2Time,
        finalScore: stateRef.current.finalScore,
      };
      const newUndoHistory = [...stateRef.current.history, currentState];
      setHistory(newUndoHistory);

      const newBoardHistory = [...boardHistory, serializedBoard];
      const newCaptures = { ...captures };
      if (currentTurnColor === "B") {
        newCaptures.B += capturedStones;
      } else {
        newCaptures.W += capturedStones;
      }

      const nextTurn = !isBlackNext;

      setBoard(newBoard);
      setIsBlackNext(nextTurn);
      setCaptures(newCaptures);
      setLastMove([row, col]);
      setPassCount(0); // Reset chuỗi bỏ lượt
      setBoardHistory(newBoardHistory);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isBlackNext: nextTurn,
            winner: winner,
            captures: newCaptures,
            lastMove: [row, col],
            passCount: 0,
            boardHistory: newBoardHistory,
            history: newUndoHistory,
            player1Time: player1Time,
            player2Time: player2Time,
            finalScore: finalScore,
          },
        });
      }
    },
    [
      board,
      boardHistory,
      isBlackNext,
      winner,
      channel,
      isPlayer1,
      isPlayer2,
      isSpectator,
      gameStarted,
      captures,
      player1Time,
      player2Time,
      finalScore,
    ],
  );

  const handlePass = () => {
    if (winner || !gameStarted || isSpectator) return;
    const currentTurnColor = isBlackNext ? "B" : "W";
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    if (myColor !== currentTurnColor) return;

    const currentState = {
      board: stateRef.current.board,
      isBlackNext: stateRef.current.isBlackNext,
      winner: stateRef.current.winner,
      lastMove: stateRef.current.lastMove,
      captures: stateRef.current.captures,
      passCount: stateRef.current.passCount,
      boardHistory: stateRef.current.boardHistory,
      player1Time: stateRef.current.player1Time,
      player2Time: stateRef.current.player2Time,
      finalScore: stateRef.current.finalScore,
    };
    const newHistory = [...stateRef.current.history, currentState];
    setHistory(newHistory);

    const newPassCount = passCount + 1;
    let newWinner = winner;
    let score = finalScore;

    // 2 người bỏ lượt liên tiếp thì kết thúc và tính điểm
    if (newPassCount >= 2) {
      const { blackScore, whiteScore } = calculateAreaScore(board);
      score = { black: blackScore, white: whiteScore };
      if (blackScore > whiteScore) {
        newWinner = "B";
      } else if (whiteScore > blackScore) {
        newWinner = "W";
      } else {
        newWinner = "Draw";
      }
    }

    const nextTurn = !isBlackNext;
    setIsBlackNext(nextTurn);
    setPassCount(newPassCount);
    if (newWinner) setWinner(newWinner);
    if (score) setFinalScore(score);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board,
          isBlackNext: nextTurn,
          winner: newWinner,
          captures,
          lastMove,
          passCount: newPassCount,
          boardHistory,
          history: newHistory,
          player1Time,
          player2Time,
          finalScore: score,
        },
      });
    }
  };

  const handleResign = () => {
    if (winner || !gameStarted || isSpectator) return;
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    if (!myColor) return;

    const newWinner = myColor === "B" ? "W" : "B";
    setWinner(newWinner);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          ...stateRef.current,
          winner: newWinner,
        },
      });
    }
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setIsBlackNext(true);
    setWinner(null);
    setLastMove(null);
    setCaptures({ B: 0, W: 0 });
    setPassCount(0);
    setBoardHistory([]);
    setHistory([]);
    setUndoRequestedBy(null);
    setFinalScore(null);
    setPlayer1Time(INITIAL_TIME);
    setPlayer2Time(INITIAL_TIME);
    setGameStarted(false);
    setReadyPlayers([]);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
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
      setIsBlackNext(prevState.isBlackNext);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setCaptures(prevState.captures);
      setPassCount(prevState.passCount);
      setBoardHistory(prevState.boardHistory);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setFinalScore(prevState.finalScore);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isBlackNext: prevState.isBlackNext,
          winner: prevState.winner,
          lastMove: prevState.lastMove,
          captures: prevState.captures,
          passCount: prevState.passCount,
          boardHistory: prevState.boardHistory,
          player1Time: prevState.player1Time,
          player2Time: prevState.player2Time,
          finalScore: prevState.finalScore,
          history: newHistory,
        },
      });
    }
  };

  const handleRejectUndo = () => {
    setUndoRequestedBy(null);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "reject-undo",
        payload: {},
      });
    }
  };

  const handleStartClick = () => {
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentTurnColor = isBlackNext ? "B" : "W";
  const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
  const isMyTurn = myColor === currentTurnColor;

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      {undoRequestedBy && undoRequestedBy !== playerName && !isSpectator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4 border border-zinc-200">
            <p className="mb-6 text-lg font-medium text-zinc-800">
              <span className="font-bold text-purple-600">
                {undoRequestedBy}
              </span>{" "}
              muốn xin đi lại 1 nước.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleAcceptUndo}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                Đồng ý
              </button>
              <button
                onClick={handleRejectUndo}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {undoRequestedBy === playerName && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg font-medium animate-pulse">
          Đang chờ đối thủ phản hồi yêu cầu đi lại...
        </div>
      )}

      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
            title="Chỉnh sửa tên"
          >
            {playerName ? playerName.charAt(0).toUpperCase() : "👤"}
          </button>
        </div>
      )}

      <Modal
        isOpen={showNameModal}
        title={
          hasInitialized
            ? "Chỉnh sửa tên"
            : roomParam
              ? "Tham gia phòng chơi"
              : "Tạo phòng chơi mới"
        }
      >
        <form onSubmit={handleJoinRoom} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-500">
            {hasInitialized
              ? "Cập nhật tên hiển thị của bạn."
              : `Vui lòng nhập tên của bạn để ${roomParam ? "tham gia cùng đối thủ" : "bắt đầu và mời bạn bè"}.`}
          </p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />

          {!hasInitialized && roomParam && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Bạn muốn tham gia với tư cách:
              </label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center space-x-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="role"
                    value="player"
                    checked={requestedRole === "player"}
                    onChange={(e) =>
                      setRequestedRole(e.target.value as "player" | "spectator")
                    }
                    className="accent-zinc-900"
                  />
                  <span>Người chơi</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="role"
                    value="spectator"
                    checked={requestedRole === "spectator"}
                    onChange={(e) =>
                      setRequestedRole(e.target.value as "player" | "spectator")
                    }
                    className="accent-zinc-900"
                  />
                  <span>Người xem</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {hasInitialized
              ? "Cập nhật"
              : roomParam
                ? "Vào phòng"
                : "Tạo phòng & Lấy link"}
          </button>
        </form>
      </Modal>

      <div className="grid w-full max-w-[1600px] flex-1 grid-cols-1 place-items-center gap-8 xl:grid-cols-[1fr_auto_1fr]">
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
            Cờ Vây (Go)
          </h1>

          {!showNameModal && (
            <>
              {player2Name ? (
                <p className="text-sm text-zinc-500 mb-4">
                  Trận đấu:{" "}
                  <span className="font-semibold text-zinc-800">
                    {player1Name} (Đen)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-800">
                    {player2Name} (Trắng)
                  </span>
                </p>
              ) : (
                <div className="mt-4 flex w-full flex-col items-center xl:items-start">
                  <p className="mb-3 text-sm text-zinc-500">
                    Đang chờ đối thủ tham gia...
                  </p>
                  <div className="flex w-full items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                    <span className="flex-1 select-all truncate text-left text-xs text-zinc-500">
                      {typeof window !== "undefined"
                        ? window.location.href
                        : ""}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="cursor-pointer whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                    >
                      {linkCopied ? "Đã copy!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              )}

              {player2Name && (
                <div className="w-full mt-2">
                  {gameStarted ? (
                    <div className="w-full space-y-4 text-left xl:text-left text-center">
                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${isBlackNext && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-zinc-800">
                            {player1Name} (Đen)
                          </span>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player1Time)}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${!isBlackNext && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-zinc-800">
                            {player2Name} (Trắng)
                          </span>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player2Time)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 text-center xl:text-left flex flex-col space-y-4">
                        <p className="text-sm font-medium text-zinc-800 bg-zinc-100 py-2 rounded-md">
                          {winner === "Draw"
                            ? "🤝 Hòa cờ!"
                            : winner === "End"
                              ? "🤝 Trận đấu kết thúc! Vui lòng xem điểm."
                              : winner
                                ? `🎉 Chiến thắng: ${winner === "B" ? player1Name : player2Name}!`
                                : `Lượt đi: ${isBlackNext ? "Đen" : "Trắng"}`}
                        </p>

                        {/* Hiển thị đếm số tù binh */}
                        <div className="flex gap-4 w-full justify-center xl:justify-start mt-2">
                          <div className="flex flex-col items-center bg-zinc-100 p-2 rounded-lg min-w-[80px]">
                            <span className="text-xs text-zinc-500 uppercase font-bold">
                              Đen bắt
                            </span>
                            <span className="text-xl font-bold text-zinc-800">
                              {captures.B}
                            </span>
                          </div>
                          <div className="flex flex-col items-center bg-zinc-100 p-2 rounded-lg min-w-[80px]">
                            <span className="text-xs text-zinc-500 uppercase font-bold">
                              Trắng bắt
                            </span>
                            <span className="text-xl font-bold text-zinc-800">
                              {captures.W}
                            </span>
                          </div>
                        </div>

                        {/* Bảng điểm kết quả nếu đã đếm đất */}
                        {finalScore && (
                          <div className="mt-4 flex flex-col w-full bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="flex w-full justify-between items-center mb-2">
                              <div className="text-center">
                                <span className="block text-xs text-zinc-500 font-bold uppercase">
                                  Điểm Đen
                                </span>
                                <span className="text-xl font-bold text-zinc-800">
                                  {finalScore.black}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-zinc-400 px-4">
                                VS
                              </div>
                              <div className="text-center">
                                <span className="block text-xs text-zinc-500 font-bold uppercase">
                                  Điểm Trắng
                                </span>
                                <span className="text-xl font-bold text-zinc-800">
                                  {finalScore.white}
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 italic text-center">
                              *Đếm theo luật Trung Quốc (Komi {KOMI}).
                              <br />
                              Tự động tính điểm giả định các quân còn trên bàn
                              đều sống.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    !isSpectator && (
                      <div className="flex w-full flex-col items-center space-y-3 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
                        <h3 className="text-base font-semibold text-zinc-800">
                          Trận đấu sắp bắt đầu!
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {readyPlayers.length}/2 người chơi đã sẵn sàng.
                        </p>
                        <button
                          onClick={handleStartClick}
                          disabled={readyPlayers.includes(playerName || "")}
                          className="mt-2 w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                        >
                          {readyPlayers.includes(playerName || "")
                            ? "Đã sẵn sàng, chờ đối thủ..."
                            : "Sẵn sàng bắt đầu"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex flex-wrap gap-4 justify-center xl:justify-start w-full">
            {gameStarted && !winner && !isSpectator && (
              <>
                {history.length > 0 && (
                  <button
                    onClick={handleRequestUndo}
                    disabled={!!undoRequestedBy}
                    className="cursor-pointer rounded-full border border-purple-300 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xin đi lại
                  </button>
                )}
                <button
                  onClick={handlePass}
                  disabled={!isMyTurn}
                  className="cursor-pointer rounded-full border border-blue-300 bg-blue-50 px-6 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bỏ lượt
                </button>
                <button
                  onClick={handleResign}
                  className="cursor-pointer rounded-full border border-red-300 bg-red-50 px-6 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100"
                >
                  Đầu hàng
                </button>
              </>
            )}
            <button
              onClick={resetGame}
              disabled={!player2Name || isSpectator}
              className="cursor-pointer rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Chơi lại
            </button>
            <Link
              href="/"
              className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đổi trò chơi
            </Link>
          </div>
        </div>

        {/* Cột giữa: Khu vực bàn cờ Vây */}
        <div className="flex flex-col items-center justify-center w-full pb-8">
          <div
            className={`bg-[#E6C697] p-2 sm:p-4 rounded-sm shadow-xl transition-opacity border-4 border-[#8B5A2B] ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="relative aspect-square w-[95vw] md:w-[75vh] md:max-w-[700px]">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {Array.from({ length: BOARD_SIZE }).map((_, r) => (
                  <line
                    key={`h${r}`}
                    x1={X(0)}
                    y1={Y(r)}
                    x2={X(BOARD_SIZE - 1)}
                    y2={Y(r)}
                    stroke="#5C4033"
                    strokeWidth="1.5"
                  />
                ))}
                {Array.from({ length: BOARD_SIZE }).map((_, c) => (
                  <line
                    key={`v${c}`}
                    x1={X(c)}
                    y1={Y(0)}
                    x2={X(c)}
                    y2={Y(BOARD_SIZE - 1)}
                    stroke="#5C4033"
                    strokeWidth="1.5"
                  />
                ))}
                {[3, 9, 15].map((r) =>
                  [3, 9, 15].map((c) => (
                    <circle
                      key={`star-${r}-${c}`}
                      cx={X(c)}
                      cy={Y(r)}
                      r="4"
                      fill="#5C4033"
                    />
                  )),
                )}
              </svg>

              <div
                className="relative z-10 grid w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                }}
              >
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isLastMove =
                      lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`relative flex items-center justify-center cursor-pointer w-full h-full rounded-full ${
                          !cell && !winner ? "hover:bg-black/20" : ""
                        }`}
                      >
                        {cell && (
                          <div
                            className={`w-[90%] h-[90%] rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.5)] ${
                              cell === "B"
                                ? "bg-zinc-900"
                                : "bg-zinc-100 border border-zinc-300"
                            }`}
                          />
                        )}
                        {/* Chấm đỏ/đen đánh dấu nước vừa đi */}
                        {isLastMove && (
                          <div
                            className={`absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full ${cell === "B" ? "bg-white" : "bg-black"}`}
                          />
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người xem */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0">
            <h3 className="text-lg font-medium text-zinc-900 mb-4 border-b border-zinc-100 pb-3">
              Người xem ({spectators.length}/5)
            </h3>
            {spectators.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Chưa có người xem</p>
            ) : (
              <ul className="space-y-3">
                {spectators.map((spec, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                      {spec.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">
                      {spec}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ Vây...
        </div>
      }
    >
      <GoGame />
    </Suspense>
  );
}
