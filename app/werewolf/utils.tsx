import { FaEye } from "react-icons/fa";
import {
  GiWolfHead,
  GiFarmer,
  GiShield,
  GiWitchFlight,
  GiMusket,
} from "react-icons/gi";
import { RoleConfig } from "./types";

export const RoleIcon = ({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) => {
  switch (id) {
    case "werewolf":
      return <GiWolfHead className={className} />;
    case "villager":
      return <GiFarmer className={className} />;
    case "seer":
      return <FaEye className={className} />;
    case "bodyguard":
      return <GiShield className={className} />;
    case "witch":
      return <GiWitchFlight className={className} />;
    case "hunter":
      return <GiMusket className={className} />;
    default:
      return null;
  }
};

export const getRoleColor = (id?: string) => {
  switch (id) {
    case "werewolf":
      return "text-red-600";
    case "villager":
      return "text-emerald-600";
    case "seer":
      return "text-purple-600";
    case "bodyguard":
      return "text-blue-600";
    case "witch":
      return "text-fuchsia-600";
    case "hunter":
      return "text-orange-600";
    default:
      return "text-zinc-500";
  }
};

export const getRoleDescription = (id?: string) => {
  switch (id) {
    case "werewolf":
      return "Mỗi đêm cùng bầy chọn cắn 1 người.";
    case "villager":
      return "Không có chức năng đặc biệt, tìm Sói vào ban ngày.";
    case "seer":
      return "Mỗi đêm soi 1 người xem có phải Sói không.";
    case "bodyguard":
      return "Mỗi đêm bảo vệ 1 người khỏi bị Sói cắn.";
    case "witch":
      return "Có 1 bình cứu 1 người và 1 bình độc giết người. Mỗi đêm được biết là người nào bị sói cắn";
    case "hunter":
      return "Mỗi đêm sẽ được chọn 1 người để ghim. nếu Thợ Sơn chết sẽ kéo theo người đó chết";
    default:
      return "";
  }
};

export const defaultRoles: RoleConfig[] = [
  { id: "werewolf", name: "Sói", count: 1 },
  { id: "villager", name: "Dân Làng", count: 3 },
  { id: "seer", name: "Tiên Tri", count: 1 },
  { id: "bodyguard", name: "Bảo Vệ", count: 1 },
  { id: "witch", name: "Phù Thủy", count: 0 },
  { id: "hunter", name: "Thợ Săn", count: 0 },
];
