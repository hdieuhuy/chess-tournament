import { FaEye, FaUserTie, FaHeart } from "react-icons/fa";
import {
  GiWolfHead,
  GiFarmer,
  GiShield,
  GiWitchFlight,
  GiMusket,
  GiWerewolf,
  GiWolfHowl,
  GiJesterHat,
  GiBullseye,
  GiBowieKnife,
  GiMagicSwirl,
  GiMusicalNotes,
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
    case "mayor":
      return <FaUserTie className={className} />;
    case "cursed_wolf":
      return <GiWerewolf className={className} />;
    case "fog_wolf":
      return <GiWolfHowl className={className} />;
    case "half_wolf":
      return <GiWolfHead className={className} />;
    case "wolf_cub":
      return <GiWolfHead className={className} />;
    case "fool":
      return <GiJesterHat className={className} />;
    case "headhunter":
      return <GiBullseye className={className} />;
    case "assassin":
      return <GiBowieKnife className={className} />;
    case "cupid":
      return <FaHeart className={className} />;
    case "medium":
      return <GiMagicSwirl className={className} />;
    case "pied_piper":
      return <GiMusicalNotes className={className} />;
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
    case "mayor":
      return "text-yellow-600";
    case "cursed_wolf":
      return "text-rose-700";
    case "fog_wolf":
      return "text-slate-600";
    case "half_wolf":
      return "text-amber-700";
    case "wolf_cub":
      return "text-red-500";
    case "fool":
      return "text-pink-600";
    case "headhunter":
      return "text-cyan-600";
    case "assassin":
      return "text-red-900";
    case "cupid":
      return "text-pink-500";
    case "medium":
      return "text-teal-600";
    case "pied_piper":
      return "text-emerald-500";
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
    case "mayor":
      return "Có 2 mạng (sống sót 1 lần bị giết). Khi biểu quyết ban ngày, phiếu của Trưởng Làng được tính bằng 2.";
    case "cursed_wolf":
      return "Cùng Sói cắn người. Được quyền chọn lây nhiễm 1 lần/trận thay vì cắn chết. Người bị lây sẽ thành Sói vào hôm sau.";
    case "fog_wolf":
      return "Cùng Sói cắn người. Ban ngày có thể tung sương mù 1 lần/trận để hủy bỏ biểu quyết và lập tức chuyển sang đêm.";
    case "half_wolf":
      return "Phe Dân Làng. Nếu bị Sói cắn, không chết mà sẽ trở thành Sói vào đêm tiếp theo.";
    case "wolf_cub":
      return "Phe Sói. Thức dậy và cắn người cùng Sói. Nếu Sói Con chết, đêm tiếp theo bầy Sói được phép cắn 2 người.";
    case "fool":
      return "Chỉ chiến thắng 1 mình. Không có kỹ năng, nhưng nếu bị làng biểu quyết treo cổ vào ban ngày, Kẻ Ngốc sẽ lập tức giành chiến thắng.";
    case "headhunter":
      return "Phe thứ 3. Hệ thống sẽ tự động gán ngẫu nhiên 1 người phe Dân làm mục tiêu. Nếu người này bị làng treo cổ và bạn còn sống, bạn giành chiến thắng.";
    case "assassin":
      return "Phe thứ 3. Mỗi đêm được chọn 1 người để giết. Chiến thắng khi làng chỉ còn 2 người (bao gồm cả bạn).";
    case "cupid":
      return "Đêm đầu tiên được chọn 2 người để ghép đôi. Hai người này sẽ sống chết có nhau. Nếu thuộc 2 phe khác nhau, cặp đôi phải sống đến cuối cùng để giành chiến thắng.";
    case "medium":
      return "Mỗi trận được phép dùng phép thuật hồi sinh 1 người đã chết. Không cần chờ đến lượt để hành động.";
    case "pied_piper":
      return "Phe thứ 3. Mỗi đêm được thôi miên 1 người (không cần đợi lượt). Bạn sẽ chiến thắng nếu tất cả những người còn sống đều đã bị thôi miên.";
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
  { id: "mayor", name: "Trưởng Làng", count: 0 },
  { id: "cursed_wolf", name: "Sói Nguyền", count: 0 },
  { id: "fog_wolf", name: "Sói Sương Mù", count: 0 },
  { id: "half_wolf", name: "Bán Sói", count: 0 },
  { id: "wolf_cub", name: "Sói Con", count: 0 },
  { id: "fool", name: "Kẻ Ngốc", count: 0 },
  { id: "headhunter", name: "Thợ Săn Người", count: 0 },
  { id: "assassin", name: "Sát Thủ", count: 0 },
  { id: "cupid", name: "Thần Tình Yêu", count: 0 },
  { id: "medium", name: "Thầy Đồng", count: 0 },
  { id: "pied_piper", name: "Người Thổi Sáo", count: 0 },
];
