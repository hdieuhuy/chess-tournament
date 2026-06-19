import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface UseLobbyInitReturn {
  hasInitialized: boolean;
  playerName: string;
  setPlayerName: (name: string) => void;
  roomId: string | null;
  requestedRole: "player" | "spectator";
  setRequestedRole: (role: "player" | "spectator") => void;
  showNameModal: boolean;
  setShowNameModal: (show: boolean) => void;
  isCheckingStorage: boolean;
  handleJoinRoom: (newName: string) => void;
  isCreator: boolean;
}

export function useLobbyInit(
  gameName: string,
  onJoin?: (newName: string, role: "player" | "spectator", isNewRoom: boolean) => void
): UseLobbyInitReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">("player");
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);

      if (!roomParam) {
        setShowNameModal(false);
        setHasInitialized(true);
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setIsCreator(true);
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        if (onJoin) onJoin(savedName, "player", true);
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        const joinedRole = localStorage.getItem(`joinedRoom_${roomParam}`);
        if (joinedRole) {
          setRequestedRole(joinedRole as "player" | "spectator");
          setShowNameModal(false);
          setHasInitialized(true);
          if (onJoin) onJoin(savedName, joinedRole as "player" | "spectator", false);
        } else {
          // Tự động tham gia với tư cách player nếu đã có tên trong localStorage
          setRequestedRole("player");
          setShowNameModal(false);
          setHasInitialized(true);
          if (onJoin) onJoin(savedName, "player", false);
        }
      }
    }
    setIsCheckingStorage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomParam, pathname, router]);

  const handleJoinRoom = useCallback(
    (newName: string) => {
      if (!newName.trim()) return;

      const trimmedName = newName.trim();
      setPlayerName(trimmedName);
      localStorage.setItem("playerName", trimmedName);

      let isNewRoom = false;
      let finalRoomId = roomId;

      if (!hasInitialized) {
        setHasInitialized(true);
        if (!roomId) {
          finalRoomId = Math.random().toString(36).substring(2, 10);
          setRoomId(finalRoomId);
          setIsCreator(true);
          setRequestedRole("player");
          localStorage.setItem(`joinedRoom_${finalRoomId}`, "player");
          isNewRoom = true;
          router.replace(`${pathname}?room=${finalRoomId}`);
        } else {
          localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
        }
      }

      setShowNameModal(false);

      if (onJoin) {
        onJoin(trimmedName, requestedRole, isNewRoom);
      }
    },
    [hasInitialized, roomId, requestedRole, pathname, router, onJoin]
  );

  return {
    hasInitialized,
    playerName,
    setPlayerName,
    roomId,
    requestedRole,
    setRequestedRole,
    showNameModal,
    setShowNameModal,
    isCheckingStorage,
    handleJoinRoom,
    isCreator,
  };
}
