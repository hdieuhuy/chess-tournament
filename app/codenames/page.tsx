"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import toast from "react-hot-toast";

interface WordCard {
  word: string;
  type: "red" | "blue" | "black" | "white";
  isFlipped?: boolean;
}

// Mock data cho 25 từ trên bàn cờ
// (9 Xanh, 8 Đỏ, 1 Đen, 7 Trắng)
const MOCK_WORDS: WordCard[] = [
  { word: "LONDON", type: "blue" },
  { word: "RIVER", type: "red" },
  { word: "WINDOW", type: "white" },
  { word: "SUN", type: "blue" },
  { word: "SEA", type: "red" },
  { word: "PENCIL", type: "white" },
  { word: "BICYCLE", type: "blue" },
  { word: "FLOWER", type: "red" },
  { word: "WIND", type: "blue" },
  { word: "CLOCK", type: "white" },
  { word: "MAP", type: "blue" },
  { word: "DOG", type: "red" },
  { word: "CAT", type: "white" },
  { word: "BOOK", type: "blue" },
  { word: "TELEVISION", type: "red" },
  { word: "PHONE", type: "white" },
  { word: "COMPUTER", type: "blue" },
  { word: "FISH", type: "black" },
  { word: "RAIN", type: "red" },
  { word: "CLOUD", type: "white" },
  { word: "FIRE", type: "blue" },
  { word: "WATER", type: "red" },
  { word: "FOREST", type: "white" },
  { word: "MOUNTAIN", type: "blue" },
  { word: "BRIDGE", type: "red" },
];

type Role =
  | "red-spymaster"
  | "red-operative"
  | "blue-spymaster"
  | "blue-operative"
  | "spectator"
  | null; // Thêm null để xử lý trường hợp không có vai trò nào được chọn

interface ClueLog {
  team: "red" | "blue";
  word: string;
  count: string;
}

function CodenamesGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  const [hostName, setHostName] = useState<string | null>(null);
  const [redSpymaster, setRedSpymaster] = useState<string | null>(null);
  const [redOperatives, setRedOperatives] = useState<string[]>([]);
  const [blueSpymaster, setBlueSpymaster] = useState<string | null>(null);
  const [blueOperatives, setBlueOperatives] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameBoard, setGameBoard] = useState<WordCard[]>(MOCK_WORDS); // Sẽ được random khi game bắt đầu
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<"red" | "blue">("blue");
  const [activeClue, setActiveClue] = useState<{
    word: string;
    count: string;
  } | null>(null);
  const [clueWord, setClueWord] = useState<string>("");
  const [clueNumber, setClueNumber] = useState<string>("");
  const [clueHistory, setClueHistory] = useState<ClueLog[]>([]);
  const [winner, setWinner] = useState<"red" | "blue" | null>(null);
  const [flipVotes, setFlipVotes] = useState<Record<number, string[]>>({});

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

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
        setRedSpymaster(savedName); // Mặc định Host sẽ là Đội trưởng Đỏ
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        const joinedRole = localStorage.getItem(`joinedRoom_${roomParam}`);
        if (joinedRole) {
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
    redSpymaster,
    redOperatives,
    blueSpymaster,
    blueOperatives,
    spectators,
    gameStarted,
    gameBoard,
    currentTurn,
    activeClue,
    clueHistory,
    winner,
    flipVotes,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      redSpymaster,
      redOperatives,
      blueSpymaster,
      blueOperatives,
      spectators,
      gameStarted,
      gameBoard,
      currentTurn,
      activeClue,
      clueHistory,
      winner,
      flipVotes,
    };
  }, [
    hostName,
    redSpymaster,
    redOperatives,
    blueSpymaster,
    blueOperatives,
    spectators,
    gameStarted,
    gameBoard,
    currentTurn,
    activeClue,
    clueHistory,
    winner,
    flipVotes,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`codenames-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newSpecs = [...state.spectators];
          const isAlreadyPlayer =
            state.redSpymaster === newPlayer ||
            state.blueSpymaster === newPlayer ||
            state.redOperatives.includes(newPlayer) ||
            state.blueOperatives.includes(newPlayer);

          if (!isAlreadyPlayer && !newSpecs.includes(newPlayer)) {
            if (newSpecs.length < 10) newSpecs.push(newPlayer); // Giới hạn 10 người xem
            setSpectators(newSpecs);
            stateRef.current.spectators = newSpecs;
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: { ...stateRef.current },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setRedSpymaster(data.redSpymaster);
        setRedOperatives(data.redOperatives);
        setBlueSpymaster(data.blueSpymaster);
        setBlueOperatives(data.blueOperatives);
        setSpectators(data.spectators);
        setGameStarted(data.gameStarted);
        if (data.gameBoard) setGameBoard(data.gameBoard);
        if (data.currentTurn) setCurrentTurn(data.currentTurn);
        if (data.activeClue !== undefined) setActiveClue(data.activeClue);
        if (data.clueHistory) setClueHistory(data.clueHistory);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.flipVotes) setFlipVotes(data.flipVotes);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setRedSpymaster((prev) => (prev === oldName ? newName : prev));
        setBlueSpymaster((prev) => (prev === oldName ? newName : prev));
        setRedOperatives((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
        setBlueOperatives((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          let newRedSpy =
            state.redSpymaster === reqPlayer ? null : state.redSpymaster;
          let newBlueSpy =
            state.blueSpymaster === reqPlayer ? null : state.blueSpymaster;
          const newRedOps = state.redOperatives.filter((p) => p !== reqPlayer);
          const newBlueOps = state.blueOperatives.filter(
            (p) => p !== reqPlayer,
          );
          const newSpecs = state.spectators.filter((s) => s !== reqPlayer);

          if (newRole === "red-spymaster") {
            if (!newRedSpy) newRedSpy = reqPlayer;
            else newSpecs.push(reqPlayer);
          } else if (newRole === "blue-spymaster") {
            if (!newBlueSpy) newBlueSpy = reqPlayer;
            else newSpecs.push(reqPlayer);
          } else if (newRole === "red-operative") {
            if (newRedOps.length < 5) newRedOps.push(reqPlayer);
            else newSpecs.push(reqPlayer);
          } else if (newRole === "blue-operative") {
            if (newBlueOps.length < 5) newBlueOps.push(reqPlayer);
            else newSpecs.push(reqPlayer);
          } else if (newRole === "spectator") {
            newSpecs.push(reqPlayer);
          }

          setRedSpymaster(newRedSpy);
          setBlueSpymaster(newBlueSpy);
          setRedOperatives(newRedOps);
          setBlueOperatives(newBlueOps);
          setSpectators(newSpecs);

          stateRef.current.redSpymaster = newRedSpy;
          stateRef.current.blueSpymaster = newBlueSpy;
          stateRef.current.redOperatives = newRedOps;
          stateRef.current.blueOperatives = newBlueOps;
          stateRef.current.spectators = newSpecs;

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: { ...stateRef.current },
          });
        }
      })
      .on("broadcast", { event: "leave-room" }, (payload) => {
        const state = stateRef.current;
        const leavingPlayer = payload.payload.playerName;

        const newRedSpy =
          state.redSpymaster === leavingPlayer ? null : state.redSpymaster;
        const newBlueSpy =
          state.blueSpymaster === leavingPlayer ? null : state.blueSpymaster;
        const newRedOps = state.redOperatives.filter(
          (p) => p !== leavingPlayer,
        );
        const newBlueOps = state.blueOperatives.filter(
          (p) => p !== leavingPlayer,
        );
        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName =
            newRedSpy ||
            newBlueSpy ||
            newRedOps[0] ||
            newBlueOps[0] ||
            newSpecs[0] ||
            null;
        }

        setRedSpymaster(newRedSpy);
        setBlueSpymaster(newBlueSpy);
        setRedOperatives(newRedOps);
        setBlueOperatives(newBlueOps);
        setSpectators(newSpecs);
        setHostName(newHostName);

        stateRef.current.redSpymaster = newRedSpy;
        stateRef.current.blueSpymaster = newBlueSpy;
        stateRef.current.redOperatives = newRedOps;
        stateRef.current.blueOperatives = newBlueOps;
        stateRef.current.spectators = newSpecs;
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
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        setCurrentTurn("blue");
        setActiveClue(null);
        setClueHistory([]);
        setWinner(null);
        setFlipVotes({});
        if (payload.payload.gameBoard) setGameBoard(payload.payload.gameBoard);
      })
      .on("broadcast", { event: "flip-card" }, (payload) => {
        const data = payload.payload;
        if (data.gameBoard) setGameBoard(data.gameBoard);
        if (data.nextTurn) setCurrentTurn(data.nextTurn);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.activeClue !== undefined) setActiveClue(data.activeClue);
        if (data.flipVotes) setFlipVotes(data.flipVotes);
      })
      .on("broadcast", { event: "send-clue" }, (payload) => {
        setActiveClue(payload.payload.clue);
        if (payload.payload.clueHistory)
          setClueHistory(payload.payload.clueHistory);
      })
      .on("broadcast", { event: "end-turn" }, (payload) => {
        setCurrentTurn(payload.payload.nextTurn);
        setActiveClue(null);
        setFlipVotes({});
      })
      .on("broadcast", { event: "flip-vote" }, (payload) => {
        setFlipVotes(payload.payload.flipVotes);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel.send({
            type: "broadcast",
            event: "request-join",
            payload: { playerName },
          });
        }
      });

    setChannel(roomChannel);
    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, playerName, hasInitialized]);

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

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const newName = inputName.trim();
    setPlayerName(newName);
    localStorage.setItem("playerName", newName);

    if (roomId) {
      // Người mới vào bằng link sẽ auto là spectator
      localStorage.setItem(`joinedRoom_${roomId}`, "spectator");
    }

    setShowNameModal(false);

    if (!hasInitialized) {
      setHasInitialized(true);
      if (!roomId) {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setHostName(newName);
        setRedSpymaster(newName);
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
      if (redSpymaster === playerName) setRedSpymaster(newName);
      if (blueSpymaster === playerName) setBlueSpymaster(newName);
      if (redOperatives.includes(playerName))
        setRedOperatives((prev) =>
          prev.map((p) => (p === playerName ? newName : p)),
        );
      if (blueOperatives.includes(playerName))
        setBlueOperatives((prev) =>
          prev.map((p) => (p === playerName ? newName : p)),
        );
      if (spectators.includes(playerName))
        setSpectators((prev) =>
          prev.map((s) => (s === playerName ? newName : s)),
        );
    }
  };

  const handleRoleChange = (newRole: Role) => {
    if (!channel) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      let newRedSpy =
        state.redSpymaster === playerName ? null : state.redSpymaster;
      let newBlueSpy =
        state.blueSpymaster === playerName ? null : state.blueSpymaster;
      const newRedOps = state.redOperatives.filter((p) => p !== playerName);
      const newBlueOps = state.blueOperatives.filter((p) => p !== playerName);
      const newSpecs = state.spectators.filter((s) => s !== playerName);

      if (newRole === "red-spymaster") {
        // Kiểm tra xem vị trí có trống không, nếu không thì trở lại người xem
        if (!state.redSpymaster || state.redSpymaster === playerName) {
          newRedSpy = playerName;
        } else {
          newSpecs.push(playerName); // Vị trí đã có người, trở thành người xem
        }
      } else if (newRole === "blue-spymaster") {
        if (!state.blueSpymaster || state.blueSpymaster === playerName) {
          newBlueSpy = playerName;
        } else {
          newSpecs.push(playerName);
        }
      } else if (newRole === "red-operative") {
        if (newRedOps.length < 5) newRedOps.push(playerName);
        else newSpecs.push(playerName);
      } else if (newRole === "blue-operative") {
        if (newBlueOps.length < 5) newBlueOps.push(playerName);
        else newSpecs.push(playerName);
      } else if (newRole === "spectator") {
        newSpecs.push(playerName);
      }

      setRedSpymaster(newRedSpy);
      setBlueSpymaster(newBlueSpy);
      setRedOperatives(newRedOps);
      setBlueOperatives(newBlueOps);
      setSpectators(newSpecs);

      stateRef.current.redSpymaster = newRedSpy;
      stateRef.current.blueSpymaster = newBlueSpy;
      stateRef.current.redOperatives = newRedOps;
      stateRef.current.blueOperatives = newBlueOps;
      stateRef.current.spectators = newSpecs;

      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    } else {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        // Nếu role đã có người, server host sẽ xử lý và chuyển người yêu cầu thành spectator
        payload: { playerName, newRole },
      });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    const state = stateRef.current;
    const newRedSpy =
      state.redSpymaster === targetName ? null : state.redSpymaster;
    const newBlueSpy =
      state.blueSpymaster === targetName ? null : state.blueSpymaster;
    const newRedOps = state.redOperatives.filter((p) => p !== targetName);
    const newBlueOps = state.blueOperatives.filter((p) => p !== targetName);
    const newSpecs = state.spectators.filter((s) => s !== targetName);

    setRedSpymaster(newRedSpy);
    setBlueSpymaster(newBlueSpy);
    setRedOperatives(newRedOps);
    setBlueOperatives(newBlueOps);
    setSpectators(newSpecs);

    stateRef.current.redSpymaster = newRedSpy;
    stateRef.current.blueSpymaster = newBlueSpy;
    stateRef.current.redOperatives = newRedOps;
    stateRef.current.blueOperatives = newBlueOps;
    stateRef.current.spectators = newSpecs;

    setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    }, 50);
  };

  const handleStartGame = () => {
    if (playerName !== hostName || !channel) return;
    const newGameBoard = MOCK_WORDS.map((c) => ({ ...c, isFlipped: false }));
    setGameBoard(newGameBoard);
    setGameStarted(true);
    setCurrentTurn("blue");
    setActiveClue(null);
    setClueHistory([]);
    setWinner(null);
    setFlipVotes({});

    channel.send({
      type: "broadcast",
      event: "game-start",
      payload: {
        gameBoard: newGameBoard,
      },
    });

    setTimeout(() => {
      stateRef.current.gameStarted = true;
      stateRef.current.gameBoard = newGameBoard;
      stateRef.current.currentTurn = "blue";
      stateRef.current.activeClue = null;
      stateRef.current.clueHistory = [];
      stateRef.current.winner = null;
      stateRef.current.flipVotes = {};
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    }, 50);
  };

  const handleSendClue = () => {
    if (!clueWord.trim() || !clueNumber || !channel) return;
    const newClue = { word: clueWord.trim(), count: clueNumber };
    const newHistory: ClueLog[] = [
      ...clueHistory,
      { team: currentTurn, word: clueWord.trim(), count: clueNumber },
    ];

    setActiveClue(newClue);
    setClueHistory(newHistory);
    setClueWord("");
    setClueNumber("");

    channel.send({
      type: "broadcast",
      event: "send-clue",
      payload: { clue: newClue, clueHistory: newHistory },
    });
  };

  const executeFlip = (index: number) => {
    const card = gameBoard[index];
    if (card.isFlipped) return;

    const newBoard = [...gameBoard];
    newBoard[index] = { ...card, isFlipped: true };

    let nextTurn = currentTurn;
    let newWinner = winner;
    let newActiveClue = activeClue;

    if (card.type === "black") {
      newWinner = currentTurn === "blue" ? "red" : "blue";
    } else if (card.type !== currentTurn) {
      nextTurn = currentTurn === "blue" ? "red" : "blue";
      newActiveClue = null;
    }

    if (!newWinner) {
      const redRemaining = newBoard.filter(
        (c) => c.type === "red" && !c.isFlipped,
      ).length;
      const blueRemaining = newBoard.filter(
        (c) => c.type === "blue" && !c.isFlipped,
      ).length;
      if (redRemaining === 0) newWinner = "red";
      if (blueRemaining === 0) newWinner = "blue";
    }

    setGameBoard(newBoard);
    setFlipVotes({});
    if (newWinner) setWinner(newWinner);
    if (nextTurn !== currentTurn) {
      setCurrentTurn(nextTurn);
      setActiveClue(newActiveClue);
    }

    channel?.send({
      type: "broadcast",
      event: "flip-card",
      payload: {
        gameBoard: newBoard,
        nextTurn,
        winner: newWinner,
        activeClue: newActiveClue,
        flipVotes: {},
      },
    });
  };

  const handleFlipCard = (index: number) => {
    if (!channel || !gameStarted || winner) return;

    const isBlueOp =
      currentTurn === "blue" && blueOperatives.includes(playerName);
    const isRedOp = currentTurn === "red" && redOperatives.includes(playerName);

    if (!isBlueOp && !isRedOp) return;
    if (!activeClue) {
      toast.error("Vui lòng đợi Đội trưởng đưa ra gợi ý!");
      return;
    }

    const card = gameBoard[index];
    if (card.isFlipped) return;

    const ops = currentTurn === "blue" ? blueOperatives : redOperatives;

    // Yêu cầu xác nhận nếu có >= 2 người đoán
    if (ops.length >= 2) {
      const currentVotes = flipVotes[index] || [];
      let newVotes;
      if (currentVotes.includes(playerName)) {
        // Bỏ vote nếu bấm lại
        newVotes = currentVotes.filter((p) => p !== playerName);
      } else {
        newVotes = [...currentVotes, playerName];
      }

      const newFlipVotes = { ...flipVotes, [index]: newVotes };
      setFlipVotes(newFlipVotes);

      channel.send({
        type: "broadcast",
        event: "flip-vote",
        payload: { flipVotes: newFlipVotes },
      });

      // Đủ số lượng người xác nhận mới lật bài
      if (newVotes.length >= ops.length) {
        executeFlip(index);
      }
    } else {
      executeFlip(index);
    }
  };

  const handleEndTurn = () => {
    if (!channel || winner) return;
    const nextTurn = currentTurn === "blue" ? "red" : "blue";
    setCurrentTurn(nextTurn);
    setActiveClue(null);
    setFlipVotes({});
    channel.send({
      type: "broadcast",
      event: "end-turn",
      payload: { nextTurn },
    });
  };

  const redRemaining = gameBoard.filter(
    (c) => c.type === "red" && !c.isFlipped,
  ).length;
  const blueRemaining = gameBoard.filter(
    (c) => c.type === "blue" && !c.isFlipped,
  ).length;

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-8">
      <style>{`
        @keyframes flipScore {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(90deg) scale(1.1); }
          100% { transform: rotateX(0deg); }
        }
        .animate-flip-score {
          animation: flipScore 0.5s ease-in-out;
        }
      `}</style>
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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "vào phòng Codenames" : "tạo phòng Codenames"}.`}
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

      {/* Nút quay lại trang chủ và Lấy link */}
      <div className="w-full max-w-[1400px] mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 shadow-sm"
        >
          ← Đổi trò chơi
        </Link>
        {!showNameModal && (
          <div className="flex w-full md:w-auto items-center space-x-2 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <span className="flex-1 select-all truncate text-left text-xs text-zinc-500 min-w-[200px]">
              {typeof window !== "undefined" ? window.location.href : ""}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="cursor-pointer whitespace-nowrap rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {linkCopied ? "Đã copy!" : "Copy Link"}
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        {/* Header: Hiển thị danh sách người xem */}
        <header className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Codenames{" "}
            <span className="font-medium text-zinc-500">(Mật danh)</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
            <span className="text-sm font-medium text-zinc-500">
              👀 Người xem:
            </span>
            {spectators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {spectators.map((spec, index) => (
                  <span
                    key={index}
                    className="group relative rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 flex items-center gap-1"
                  >
                    {spec} {hostName === spec && "👑"}
                    {hostName === playerName && spec !== playerName && (
                      <button
                        onClick={() => handleKickPlayer(spec)}
                        className="ml-1 hidden group-hover:inline text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">Chưa có ai</span>
            )}

            {/* Nút thoát về làm khán giả nếu đang ngồi ở các ghế */}
            {(redSpymaster === playerName ||
              blueSpymaster === playerName ||
              redOperatives.includes(playerName) ||
              blueOperatives.includes(playerName)) && (
              <button
                onClick={() => handleRoleChange("spectator")}
                className="text-xs border border-zinc-300 rounded-full px-3 py-1 hover:bg-zinc-100 transition-colors"
              >
                + Làm người xem
              </button>
            )}
          </div>
        </header>

        {/* Container: Chia 3 giao diện flex ngang */}
        <div className="flex flex-col xl:flex-row w-full gap-6 items-start">
          {/* Layout 1: Team Đỏ */}
          <div className="flex w-full xl:w-1/4 flex-col gap-4">
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm min-h-[250px] flex flex-col">
              <div className="mb-3 flex items-center justify-between border-b border-red-200 pb-2">
                <h3 className="font-bold text-red-700">🔴 Team Đỏ</h3>
                <div className="flex gap-2">
                  <span
                    key={`red-${redRemaining}`}
                    className="animate-flip-score text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded flex items-center inline-block"
                  >
                    Còn {redRemaining} từ
                  </span>
                  {hostName === playerName && !gameStarted && (
                    <button
                      onClick={handleStartGame}
                      className="text-xs font-bold bg-zinc-900 text-white px-3 py-1 rounded hover:bg-zinc-800 transition-colors"
                    >
                      Bắt đầu Game
                    </button>
                  )}
                </div>
              </div>

              {/* Ô trên: OPERATIVES (Người đoán) */}
              <div className="flex-1 rounded-xl bg-white border border-red-100 p-3 mb-3 flex flex-col items-center justify-center border-dashed">
                <span className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">
                  Operatives
                </span>
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {redOperatives.length === 0 ? (
                    <span className="text-xs text-zinc-400 italic">Trống</span>
                  ) : (
                    redOperatives.map((op) => (
                      <span
                        key={op}
                        className="text-sm font-medium text-zinc-800 group relative flex items-center gap-1"
                      >
                        {op} {op === playerName && "(Bạn)"}
                        {hostName === playerName && op !== playerName && (
                          <button
                            onClick={() => handleKickPlayer(op)}
                            className="text-red-500 hover:text-red-700 text-[10px]"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
                {!redOperatives.includes(playerName) && (
                  // Chỉ hiển thị nút nếu số lượng operatives < 5
                  <button
                    onClick={() => handleRoleChange("red-operative")}
                    className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md font-medium hover:bg-red-100 transition-colors"
                    disabled={redOperatives.length >= 5}
                  >
                    + Vào vị trí Người đoán
                  </button>
                )}
              </div>

              {/* Ô dưới: SPYMASTER (Đội trưởng) */}
              <div className="flex-1 rounded-xl bg-white border border-red-100 p-3 flex flex-col items-center justify-center border-dashed">
                <span className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">
                  Spymaster
                </span>
                <div className="flex justify-center mb-2">
                  {redSpymaster ? (
                    <span className="text-sm font-medium text-zinc-800 group relative flex items-center gap-1">
                      {redSpymaster} {redSpymaster === playerName && "(Bạn)"}
                      {hostName === playerName &&
                        redSpymaster !== playerName && (
                          <button
                            onClick={() => handleKickPlayer(redSpymaster)}
                            className="text-red-500 hover:text-red-700 text-[10px]"
                          >
                            ✕
                          </button>
                        )}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Trống</span>
                  )}
                </div>
                {!redSpymaster && ( // Chỉ hiển thị nếu vị trí trống
                  <button
                    onClick={() => handleRoleChange("red-spymaster")}
                    className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md font-medium hover:bg-red-100 transition-colors"
                    disabled={!!redSpymaster} // Vô hiệu hóa nếu đã có spymaster
                  >
                    + Vào vị trí Đội trưởng
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Layout 2: Bảng danh sách 25 từ */}
          <div className="flex w-full xl:w-2/4 flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {gameBoard.map((card, index) => {
                  // Màu sắc tương ứng theo type (sau này sẽ ẩn với Operatives)
                  let bgColor = "bg-zinc-100 border-zinc-200 text-zinc-800";
                  let opacity = "opacity-100";

                  if (gameStarted) {
                    const isSpymaster =
                      playerName === redSpymaster ||
                      playerName === blueSpymaster;

                    if (card.isFlipped) {
                      if (card.type === "red")
                        bgColor =
                          "bg-red-500 border-red-600 text-white shadow-inner";
                      if (card.type === "blue")
                        bgColor =
                          "bg-blue-500 border-blue-600 text-white shadow-inner";
                      if (card.type === "black")
                        bgColor =
                          "bg-zinc-800 border-zinc-900 text-white shadow-inner";
                      if (card.type === "white")
                        bgColor =
                          "bg-[#d8d3c5] border-[#c4bdae] text-zinc-800 shadow-inner";
                      opacity = "opacity-60";
                    } else if (isSpymaster || winner) {
                      if (card.type === "red")
                        bgColor = "bg-red-200 border-red-300 text-red-900";
                      if (card.type === "blue")
                        bgColor = "bg-blue-200 border-blue-300 text-blue-900";
                      if (card.type === "black")
                        bgColor = "bg-zinc-400 border-zinc-500 text-zinc-900";
                      if (card.type === "white")
                        bgColor = "bg-zinc-100 border-zinc-200 text-zinc-800";
                    }
                  }

                  const isOp =
                    (currentTurn === "blue" &&
                      blueOperatives.includes(playerName)) ||
                    (currentTurn === "red" &&
                      redOperatives.includes(playerName));
                  const isClickable =
                    gameStarted &&
                    !winner &&
                    isOp &&
                    activeClue &&
                    !card.isFlipped;

                  const votes = flipVotes[index] || [];
                  const currentOps =
                    currentTurn === "blue" ? blueOperatives : redOperatives;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        isClickable ? handleFlipCard(index) : undefined
                      }
                      disabled={!isClickable}
                      className={`
                        relative flex aspect-[4/3] w-full flex-col items-center justify-center
                        rounded-lg border-2 p-1 text-center transition-transform uppercase font-bold
                        ${isClickable ? "hover:-translate-y-1 hover:shadow-md cursor-pointer" : "cursor-default"} 
                        sm:text-sm text-[10px] md:text-base leading-tight
                        ${bgColor} ${opacity}
                      `}
                    >
                      <span className="line-clamp-2 px-1">{card.word}</span>
                      {card.isFlipped && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-md"></span>
                      )}
                      {votes.length > 0 && !card.isFlipped && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          {votes.map((voter) => (
                            <div
                              key={voter}
                              className={`w-2 h-2 rounded-full ${currentTurn === "blue" ? "bg-blue-500" : "bg-red-500"} shadow-md border border-white`}
                              title={voter}
                            ></div>
                          ))}
                        </div>
                      )}
                      {votes.length > 0 &&
                        currentOps.length >= 2 &&
                        !card.isFlipped && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-bold text-zinc-600 bg-white/90 px-1.5 rounded-md shadow-sm">
                            {votes.length}/{currentOps.length}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khu vực Nhập Clue của Spymaster */}
            {gameStarted && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-zinc-800">
                    {winner ? (
                      <span
                        className={
                          winner === "blue" ? "text-blue-600" : "text-red-600"
                        }
                      >
                        🎉 Team {winner === "blue" ? "Xanh" : "Đỏ"} CHIẾN THẮNG!
                      </span>
                    ) : (
                      <>
                        Lượt hiện tại:{" "}
                        <span
                          className={
                            currentTurn === "blue"
                              ? "text-blue-600"
                              : "text-red-600"
                          }
                        >
                          Team {currentTurn === "blue" ? "Xanh" : "Đỏ"}
                        </span>
                      </>
                    )}
                  </h3>
                  {!winner &&
                    ((currentTurn === "blue" &&
                      blueOperatives.includes(playerName)) ||
                      (currentTurn === "red" &&
                        redOperatives.includes(playerName))) &&
                    activeClue && (
                      <button
                        onClick={handleEndTurn}
                        className="cursor-pointer rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300 transition-colors"
                      >
                        Kết thúc lượt
                      </button>
                    )}
                </div>

                {activeClue ? (
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                    <p className="text-sm text-zinc-500 mb-1">
                      Gợi ý từ Đội trưởng:
                    </p>
                    <p className="text-2xl font-bold uppercase text-zinc-800">
                      {activeClue.word} <span className="text-zinc-400">/</span>{" "}
                      {activeClue.count}
                    </p>
                  </div>
                ) : (currentTurn === "blue" && playerName === blueSpymaster) ||
                  (currentTurn === "red" && playerName === redSpymaster) ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={clueWord}
                      onChange={(e) => setClueWord(e.target.value)}
                      placeholder="Nhập từ gợi ý..."
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <input
                      type="number"
                      value={clueNumber}
                      onChange={(e) => setClueNumber(e.target.value)}
                      placeholder="Số lượng"
                      className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      min="0"
                    />
                    <button
                      onClick={handleSendClue}
                      disabled={!clueWord.trim() || !clueNumber}
                      className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Gửi gợi ý
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-4 text-sm text-zinc-500 italic bg-zinc-50 rounded-xl border border-zinc-200">
                    Đang chờ Đội trưởng đưa ra gợi ý...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Layout 3: Team Xanh */}
          <div className="flex w-full xl:w-1/4 flex-col gap-4">
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 shadow-sm min-h-[250px] flex flex-col">
              <div className="mb-3 flex items-center justify-between border-b border-blue-200 pb-2">
                <h3 className="font-bold text-blue-700">🔵 Team Xanh</h3>
                <span
                  key={`blue-${blueRemaining}`}
                  className="animate-flip-score text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded flex items-center inline-block"
                >
                  Còn {blueRemaining} từ
                </span>
              </div>

              {/* Ô trên: OPERATIVES (Người đoán) */}
              <div className="flex-1 rounded-xl bg-white border border-blue-100 p-3 mb-3 flex flex-col items-center justify-center border-dashed">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Operatives
                </span>
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {blueOperatives.length === 0 ? (
                    <span className="text-xs text-zinc-400 italic">Trống</span>
                  ) : (
                    blueOperatives.map((op) => (
                      <span
                        key={op}
                        className="text-sm font-medium text-zinc-800 group relative flex items-center gap-1"
                      >
                        {op} {op === playerName && "(Bạn)"}
                        {hostName === playerName && op !== playerName && (
                          <button
                            onClick={() => handleKickPlayer(op)}
                            className="text-red-500 hover:text-red-700 text-[10px]"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
                {!blueOperatives.includes(playerName) && (
                  // Chỉ hiển thị nút nếu số lượng operatives < 5
                  <button
                    onClick={() => handleRoleChange("blue-operative")}
                    className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100 transition-colors"
                    disabled={blueOperatives.length >= 5}
                  >
                    + Vào vị trí Người đoán
                  </button>
                )}
              </div>

              {/* Ô dưới: SPYMASTER (Đội trưởng) */}
              <div className="flex-1 rounded-xl bg-white border border-blue-100 p-3 flex flex-col items-center justify-center border-dashed">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Spymaster
                </span>
                <div className="flex justify-center mb-2">
                  {blueSpymaster ? (
                    <span className="text-sm font-medium text-zinc-800 group relative flex items-center gap-1">
                      {blueSpymaster} {blueSpymaster === playerName && "(Bạn)"}
                      {hostName === playerName &&
                        blueSpymaster !== playerName && (
                          <button
                            onClick={() => handleKickPlayer(blueSpymaster)}
                            className="text-red-500 hover:text-red-700 text-[10px]"
                          >
                            ✕
                          </button>
                        )}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Trống</span>
                  )}
                </div>
                {!blueSpymaster && ( // Chỉ hiển thị nếu vị trí trống
                  <button
                    onClick={() => handleRoleChange("blue-spymaster")}
                    className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100 transition-colors"
                    disabled={!!blueSpymaster} // Vô hiệu hóa nếu đã có spymaster
                  >
                    + Vào vị trí Đội trưởng
                  </button>
                )}
              </div>
            </div>

            {/* Lịch sử Gợi ý */}
            {gameStarted && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col flex-1 max-h-[400px]">
                <h3 className="font-bold text-zinc-800 mb-3 border-b border-zinc-200 pb-2">
                  Lịch sử Gợi ý
                </h3>
                <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                  {clueHistory.length === 0 ? (
                    <span className="text-xs text-zinc-400 italic text-center py-2">
                      Chưa có gợi ý nào
                    </span>
                  ) : (
                    clueHistory.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-sm ${log.team === "red" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}
                      >
                        <span
                          className={`font-bold ${log.team === "red" ? "text-red-700" : "text-blue-700"}`}
                        >
                          {log.team === "red" ? "Đỏ" : "Xanh"}:
                        </span>
                        <span className="ml-2 font-medium text-zinc-800 uppercase">
                          {log.word}
                        </span>
                        <span className="ml-1 text-zinc-500">
                          / {log.count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CodenamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải phòng Codenames...
        </div>
      }
    >
      <CodenamesGame />
    </Suspense>
  );
}
