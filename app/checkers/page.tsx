"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";
import { FaCrown } from "react-icons/fa";

const INITIAL_BOARD: (string | null)[][] = [
  [null, "r", null, "r", null, "r", null, "r"],
  ["r", null, "r", null, "r", null, "r", null],
  [null, "r", null, "r", null, "r", null, "r"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["b", null, "b", null, "b", null, "b", null],
  [null, "b", null, "b", null, "b", null, "b"],
  ["b", null, "b", null, "b", null, "b", null],
];

type Move = {
  from: [number, number];
  to: [number, number];
  jumped: [number, number] | null;
};

// Lấy tất cả các nước đi hợp lệ cho người chơi hiện tại
// Luật Checkers: Nếu có nước nhảy (ăn quân), bắt buộc phải thực hiện.
const getValidMoves = (
  board: (string | null)[][],
  isBlackTurn: boolean,
  multiJumpPiece: [number, number] | null = null,
): Move[] => {
  const moves: Move[] = [];
  const jumps: Move[] = [];

  const playerPiece = isBlackTurn ? "b" : "r";
  const playerKing = isBlackTurn ? "B" : "R";
  const enemyPiece = isBlackTurn ? "r" : "b";
  const enemyKing = isBlackTurn ? "R" : "B";

  // Quân Đen đi lên (row -1), Quân Đỏ đi xuống (row +1)
  const directionsMan = isBlackTurn
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
  const directionsKing = [
    [1, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
  ];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (
        multiJumpPiece &&
        (r !== multiJumpPiece[0] || c !== multiJumpPiece[1])
      ) {
        continue;
      }

      const p = board[r][c];
      if (p === playerPiece || p === playerKing) {
        const dirs = p === playerKing ? directionsKing : directionsMan;
        for (const [dr, dc] of dirs) {
          // Nước đi thông thường
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!board[nr][nc] && !multiJumpPiece) {
              moves.push({ from: [r, c], to: [nr, nc], jumped: null });
            }
          }

          // Nước nhảy (ăn quân)
          const jr = r + dr * 2;
          const jc = c + dc * 2;
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
            if (!board[jr][jc]) {
              const jumpedPiece = board[nr][nc];
              if (jumpedPiece === enemyPiece || jumpedPiece === enemyKing) {
                jumps.push({ from: [r, c], to: [jr, jc], jumped: [nr, nc] });
              }
            }
          }
        }
      }
    }
  }

  // Bắt buộc ăn quân nếu có thể
  return jumps.length > 0 ? jumps : moves;
};

const INITIAL_TIME = 600; // 10 phút tính bằng giây

function CheckersGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [isBlackTurn, setIsBlackTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [multiJumpPiece, setMultiJumpPiece] = useState<[number, number] | null>(
    null,
  );
  const [lastMove, setLastMove] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
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
  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);

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
    isBlackTurn,
    winner,
    lastMove,
    multiJumpPiece,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      isBlackTurn,
      winner,
      lastMove,
      multiJumpPiece,
      history,
      undoRequestedBy,
      gameStarted,
      readyPlayers,
      player1Time,
      player2Time,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isBlackTurn,
    winner,
    lastMove,
    multiJumpPiece,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`checkers-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { history: newHistory, ...data } = payload.payload;
        setBoard(data.board);
        setIsBlackTurn(data.isBlackTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        setMultiJumpPiece(
          data.multiJumpPiece !== undefined ? data.multiJumpPiece : null,
        );
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(data.player1Time);
        setPlayer2Time(data.player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsBlackTurn(true);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setMultiJumpPiece(null);
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
              if (!newP2) {
                newP2 = newPlayer;
                setPlayer2Name(newP2);
                stateRef.current.player2Name = newP2;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason:
                      "Phòng đã đủ 2 người chơi, vui lòng tham gia với tư cách Người xem!",
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
              player2Name: newP2,
              spectators: newSpecs,
              readyPlayers: [],
              player1Time: INITIAL_TIME,
              player2Time: INITIAL_TIME,
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
        setIsBlackTurn(data.isBlackTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        setMultiJumpPiece(
          data.multiJumpPiece !== undefined ? data.multiJumpPiece : null,
        );
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined)
          setUndoRequestedBy(data.undoRequestedBy);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
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
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          alert("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player" && !state.player2Name) {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            setPlayer2Name(reqPlayer);
            setSpectators(newSpecs);
            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: {
                ...stateRef.current,
                player2Name: reqPlayer,
                spectators: newSpecs,
              },
            });
          }
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

  // Logic Đếm giờ
  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isBlackTurn) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("R"); // Red wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "R", player1Time: 0 },
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
  }, [gameStarted, winner, isBlackTurn, channel, playerName, hostName]);

  useEffect(() => {
    if (winner && winner !== "Draw") {
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
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
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

  const validMoves = getValidMoves(board, isBlackTurn, multiJumpPiece);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator) return;

      const myColor = isPlayer1 ? "B" : isPlayer2 ? "R" : null;
      const currentTurnColor = isBlackTurn ? "B" : "R";

      if (myColor !== currentTurnColor) return;

      const piece = board[r][c];
      const isMyPiece =
        piece &&
        (isBlackTurn
          ? piece === "b" || piece === "B"
          : piece === "r" || piece === "R");

      if (isMyPiece) {
        // Chỉ cho phép chọn quân cờ có thể đi (và bắt buộc ăn nếu có)
        if (multiJumpPiece) {
          if (r === multiJumpPiece[0] && c === multiJumpPiece[1]) {
            setSelectedPos([r, c]);
          }
        } else {
          const hasMoves = validMoves.some(
            (m) => m.from[0] === r && m.from[1] === c,
          );
          if (hasMoves) {
            setSelectedPos([r, c]);
          }
        }
        return;
      }

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        const move = validMoves.find(
          (m) =>
            m.from[0] === fr &&
            m.from[1] === fc &&
            m.to[0] === r &&
            m.to[1] === c,
        );

        if (move) {
          const currentState = {
            board: stateRef.current.board,
            isBlackTurn: stateRef.current.isBlackTurn,
            winner: stateRef.current.winner,
            lastMove: stateRef.current.lastMove,
            multiJumpPiece: stateRef.current.multiJumpPiece,
            player1Time: stateRef.current.player1Time,
            player2Time: stateRef.current.player2Time,
          };
          const newHistory = [...stateRef.current.history, currentState];
          setHistory(newHistory);

          const newBoard = board.map((row) => [...row]);
          const p = newBoard[fr][fc] as string;
          newBoard[fr][fc] = null;
          newBoard[r][c] = p;

          if (move.jumped) {
            newBoard[move.jumped[0]][move.jumped[1]] = null; // Bỏ quân bị nhảy qua
          }

          let promoted = false;
          if (p === "b" && r === 0) {
            newBoard[r][c] = "B";
            promoted = true;
          } else if (p === "r" && r === 7) {
            newBoard[r][c] = "R";
            promoted = true;
          }

          let nextMultiJumpPiece: [number, number] | null = null;
          let nextIsBlackTurn = isBlackTurn;

          if (move.jumped && !promoted) {
            const furtherMoves = getValidMoves(newBoard, isBlackTurn, [r, c]);
            if (furtherMoves.length > 0 && furtherMoves[0].jumped) {
              nextMultiJumpPiece = [r, c];
              setSelectedPos([r, c]);
            } else {
              nextIsBlackTurn = !isBlackTurn;
              setSelectedPos(null);
            }
          } else {
            nextIsBlackTurn = !isBlackTurn;
            setSelectedPos(null);
          }

          // Kiểm tra xem người tiếp theo có bị khóa nước đi không
          const nextPlayerMoves = getValidMoves(
            newBoard,
            nextIsBlackTurn,
            nextMultiJumpPiece,
          );
          let newWinner = null;
          if (nextPlayerMoves.length === 0) {
            newWinner = isBlackTurn ? "B" : "R";
          } else {
            // Kiểm tra bị mất hết quân cờ
            const nextPlayerPiece = nextIsBlackTurn ? "b" : "r";
            const nextPlayerKing = nextIsBlackTurn ? "B" : "R";
            let hasPieces = false;
            for (let rr = 0; rr < 8; rr++) {
              for (let cc = 0; cc < 8; cc++) {
                if (
                  newBoard[rr][cc] === nextPlayerPiece ||
                  newBoard[rr][cc] === nextPlayerKing
                ) {
                  hasPieces = true;
                  break;
                }
              }
            }
            if (!hasPieces) {
              newWinner = isBlackTurn ? "B" : "R";
            }
          }

          setBoard(newBoard);
          setIsBlackTurn(nextIsBlackTurn);
          setMultiJumpPiece(nextMultiJumpPiece);
          setLastMove({ from: [fr, fc], to: [r, c] });
          if (newWinner) setWinner(newWinner);

          if (channel) {
            channel.send({
              type: "broadcast",
              event: "sync-move",
              payload: {
                board: newBoard,
                isBlackTurn: nextIsBlackTurn,
                multiJumpPiece: nextMultiJumpPiece,
                lastMove: { from: [fr, fc], to: [r, c] },
                winner: newWinner,
                history: newHistory,
                player1Time,
                player2Time,
              },
            });
          }
        } else {
          if (!multiJumpPiece) setSelectedPos(null);
        }
      }
    },
    [
      board,
      isBlackTurn,
      winner,
      channel,
      player1Name,
      player2Name,
      playerName,
      selectedPos,
      multiJumpPiece,
      isSpectator,
      gameStarted,
      validMoves,
      isPlayer1,
      isPlayer2,
      player1Time,
      player2Time,
    ],
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsBlackTurn(true);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setMultiJumpPiece(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlayer1Time(INITIAL_TIME);
    setPlayer2Time(INITIAL_TIME);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if (targetName === player2Name && gameStarted) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    if (targetName === player2Name) {
      setPlayer2Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) {
        resetGame();
      }
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player2Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter(
              (p) => p !== targetName,
            ),
          },
        });
      }, 50);
    } else if (spectators.includes(targetName)) {
      const newSpecs = spectators.filter((s) => s !== targetName);
      setSpectators(newSpecs);
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current, spectators: newSpecs },
      });
    }
  };

  const handleBecomePlayer = () => {
    if (channel && isSpectator && !player2Name) {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player" },
      });
      setRequestedRole("player");
      if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "player");
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
      setIsBlackTurn(prevState.isBlackTurn);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setMultiJumpPiece(prevState.multiJumpPiece);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setHistory(newHistory);
      setUndoRequestedBy(null);
      setSelectedPos(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isBlackTurn: prevState.isBlackTurn,
          winner: prevState.winner,
          lastMove: prevState.lastMove,
          multiJumpPiece: prevState.multiJumpPiece,
          player1Time: prevState.player1Time,
          player2Time: prevState.player2Time,
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

  const handleResign = () => {
    if (winner || !gameStarted || isSpectator) return;
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "R" : null;
    if (!myColor) return;

    const newWinner = myColor === "B" ? "R" : "B";
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "bắt đầu trận cờ đam" : "tạo phòng"}.`}
          </p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên..."
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

      <div className="grid w-full max-w-full flex-1 grid-cols-1 place-items-center gap-8 px-2 md:px-8 xl:grid-cols-[300px_auto_300px]">
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
            Cờ Đam (Checkers)
          </h1>

          {!showNameModal && (
            <>
              {player2Name ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 xl:justify-start justify-center">
                  <span>Trận đấu:</span>
                  <span className="font-semibold text-zinc-800">
                    {player1Name} (Đen)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-red-600">
                    {player2Name} (Đỏ)
                  </span>
                  {playerName === hostName && !gameStarted && (
                    <button
                      onClick={() => handleKickPlayer(player2Name)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
                    >
                      Kick
                    </button>
                  )}
                </div>
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
                  {isSpectator && (
                    <button
                      onClick={handleBecomePlayer}
                      className="mt-4 w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      Tham gia làm người chơi
                    </button>
                  )}
                </div>
              )}

              {player2Name && (
                <div className="mt-6 w-full">
                  {gameStarted ? (
                    <div className="w-full space-y-4 text-left xl:text-left text-center">
                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${isBlackTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-zinc-800">
                              {player1Name} (Đen)
                            </span>
                          </div>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player1Time)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${!isBlackTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-red-600">
                              {player2Name} (Đỏ)
                            </span>
                          </div>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player2Time)}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 text-center xl:text-left">
                        <p className="text-sm font-medium text-zinc-800">
                          {winner === "Draw"
                            ? "🤝 Hòa cờ!"
                            : winner
                              ? `🎉 Chiến thắng: ${winner === "B" ? player1Name : player2Name}!`
                              : `Lượt đi: ${isBlackTurn ? "Đen" : "Đỏ"}`}
                        </p>
                      </div>
                      {gameStarted && !winner && !isSpectator && (
                        <button
                          onClick={handleResign}
                          className="mt-2 w-full cursor-pointer rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                        >
                          Bỏ cuộc
                        </button>
                      )}
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

          <div className="mt-10 flex w-full flex-wrap justify-center gap-4 xl:justify-start">
            {gameStarted && !winner && !isSpectator && history.length > 0 && (
              <button
                onClick={handleRequestUndo}
                disabled={!!undoRequestedBy}
                className="cursor-pointer rounded-full border border-purple-300 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xin đi lại
              </button>
            )}
            {playerName === hostName && (
              <button
                onClick={resetGame}
                disabled={!player2Name}
                className="cursor-pointer rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Chơi lại
              </button>
            )}
            <Link
              href="/"
              className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đổi trò chơi
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col items-center pb-8">
          <div
            className={`transition-opacity ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="relative pl-5 pb-5 sm:pl-6 sm:pb-6">
              <div className="absolute top-0 bottom-5 sm:bottom-6 left-0 flex w-5 sm:w-6 flex-col text-xs sm:text-sm font-bold text-zinc-500 select-none">
                {(isPlayer2
                  ? [1, 2, 3, 4, 5, 6, 7, 8]
                  : [8, 7, 6, 5, 4, 3, 2, 1]
                ).map((n) => (
                  <div
                    key={n}
                    className="flex flex-1 items-center justify-center"
                  >
                    {n}
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 left-5 sm:left-6 right-0 flex h-5 sm:h-6 text-xs sm:text-sm font-bold text-zinc-500 select-none">
                {(isPlayer2
                  ? ["H", "G", "F", "E", "D", "C", "B", "A"]
                  : ["A", "B", "C", "D", "E", "F", "G", "H"]
                ).map((l) => (
                  <div
                    key={l}
                    className="flex flex-1 items-center justify-center"
                  >
                    {l}
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-8 grid-rows-8 w-[88vw] md:w-[70vh] md:max-w-[720px] aspect-square border-4 border-[#8B5A2B] shadow-2xl">
                {(() => {
                  const shouldFlip = isPlayer2;
                  return (shouldFlip ? [...board].reverse() : board).map(
                    (row, mappedR) => {
                      const r = shouldFlip ? 7 - mappedR : mappedR;
                      return (shouldFlip ? [...row].reverse() : row).map(
                        (piece, mappedC) => {
                          const c = shouldFlip ? 7 - mappedC : mappedC;

                          const isLight = (r + c) % 2 === 0;
                          const bgClass = isLight
                            ? "bg-[#F0D9B5]"
                            : "bg-[#B58863]";

                          const isSelected =
                            selectedPos?.[0] === r && selectedPos?.[1] === c;
                          const isLastMove =
                            (lastMove?.from[0] === r &&
                              lastMove?.from[1] === c) ||
                            (lastMove?.to[0] === r && lastMove?.to[1] === c);

                          const validMove =
                            selectedPos &&
                            validMoves.find(
                              (m) =>
                                m.from[0] === selectedPos[0] &&
                                m.from[1] === selectedPos[1] &&
                                m.to[0] === r &&
                                m.to[1] === c,
                            );

                          const isSelectable =
                            !winner &&
                            piece &&
                            ((isBlackTurn &&
                              isPlayer1 &&
                              (piece === "b" || piece === "B")) ||
                              (!isBlackTurn &&
                                isPlayer2 &&
                                (piece === "r" || piece === "R"))) &&
                            (!multiJumpPiece ||
                              (multiJumpPiece[0] === r &&
                                multiJumpPiece[1] === c)) &&
                            validMoves.some(
                              (m) => m.from[0] === r && m.from[1] === c,
                            );

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`relative w-full h-full flex items-center justify-center ${isSelectable ? "cursor-pointer" : ""} ${bgClass}`}
                              onClick={() => handleCellClick(r, c)}
                            >
                              {isSelected && (
                                <div className="absolute inset-0 bg-blue-400/50 z-10" />
                              )}
                              {isLastMove && !isSelected && (
                                <div className="absolute inset-0 bg-yellow-400/40 z-10" />
                              )}
                              {validMove && (
                                <div className="w-[30%] h-[30%] bg-black/20 rounded-full z-20 pointer-events-none" />
                              )}
                              {piece && (
                                <div
                                  className={`relative z-30 w-[80%] h-[80%] rounded-full shadow-md flex items-center justify-center border-4 ${
                                    piece.toLowerCase() === "r"
                                      ? "bg-red-600 border-red-800"
                                      : "bg-zinc-800 border-zinc-950"
                                  } ${isSelectable && !isSelected ? "hover:scale-105 transition-transform" : ""}`}
                                >
                                  <div
                                    className={`absolute inset-0 rounded-full border-2 m-1 ${
                                      piece.toLowerCase() === "r"
                                        ? "border-red-500"
                                        : "border-zinc-700"
                                    }`}
                                  />
                                  {(piece === "R" || piece === "B") && (
                                    <FaCrown
                                      className={
                                        piece === "R"
                                          ? "text-yellow-400 text-xl"
                                          : "text-yellow-500 text-xl"
                                      }
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      );
                    },
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người xem */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0 overflow-hidden flex flex-col max-h-[400px]">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-lg">👀</span> Người xem
              </h3>
              <span className="bg-zinc-200 text-zinc-700 py-1 px-2.5 rounded-full text-xs font-bold">
                {spectators.length}/10
              </span>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              {spectators.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-2 opacity-20">🪑</span>
                  <p className="text-sm text-zinc-400 font-medium">
                    Chưa có người xem
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {spectators.map((spec, idx) => (
                    <li
                      key={idx}
                      className="group flex items-center justify-between space-x-3 rounded-xl border border-transparent p-2 transition-all hover:bg-zinc-50 hover:border-zinc-100"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-700 shadow-inner">
                          {spec.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-sm font-medium text-zinc-800 truncate"
                          title={spec}
                        >
                          {spec}
                        </span>
                      </div>
                      {playerName === hostName && (
                        <button
                          onClick={() => handleKickPlayer(spec)}
                          className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 opacity-100 xl:opacity-0 transition-all hover:bg-red-100 xl:group-hover:opacity-100 focus:opacity-100"
                          title="Kích người xem"
                        >
                          Kick
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn Cờ Đam...
        </div>
      }
    >
      <CheckersGame />
    </Suspense>
  );
}
