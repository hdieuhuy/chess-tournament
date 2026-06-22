"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Zap,
  Users,
  Globe2,
  Trophy,
  Sparkles,
  Swords,
  ChevronRight
} from "lucide-react";

const BOARD_GAMES = [
  {
    href: "/xiangqi",
    title: "Cờ Tướng",
    subtitle: "Xiangqi",
    iconUrl: "/icons/xiangqi.png",
    bgGradient: "from-red-500/10 to-red-500/0",
    borderGlow: "group-hover:border-red-500/30",
    iconBg: "bg-red-500/10",
  },
  {
    href: "/chess",
    title: "Cờ Vua",
    subtitle: "Chess",
    iconUrl: "/icons/chess.png",
    bgGradient: "from-amber-500/10 to-amber-500/0",
    borderGlow: "group-hover:border-amber-500/30",
    iconBg: "bg-amber-500/10",
  },
  {
    href: "/gomoku",
    title: "Cờ Caro",
    subtitle: "Gomoku",
    iconUrl: "/icons/gomoku.png",
    bgGradient: "from-emerald-500/10 to-emerald-500/0",
    borderGlow: "group-hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
  },
  {
    href: "/go",
    title: "Cờ Vây",
    subtitle: "Go",
    iconUrl: "/icons/go.png",
    bgGradient: "from-zinc-500/10 to-zinc-500/0",
    borderGlow: "group-hover:border-zinc-500/30",
    iconBg: "bg-zinc-800",
  },
  {
    href: "/jungle",
    title: "Cờ Thú",
    subtitle: "Jungle",
    iconUrl: "/icons/jungle.png",
    bgGradient: "from-yellow-500/10 to-yellow-500/0",
    borderGlow: "group-hover:border-yellow-500/30",
    iconBg: "bg-yellow-500/10",
  },
  {
    href: "/checkers",
    title: "Cờ Đam",
    subtitle: "Checkers",
    iconUrl: "/icons/checkers.png",
    bgGradient: "from-rose-500/10 to-rose-500/0",
    borderGlow: "group-hover:border-rose-500/30",
    iconBg: "bg-rose-500/10",
  },
  {
    href: "/oanquan",
    title: "Ô Ăn Quan",
    subtitle: "O An Quan",
    iconUrl: "/icons/oanquan.png",
    bgGradient: "from-orange-500/10 to-orange-500/0",
    borderGlow: "group-hover:border-orange-500/30",
    iconBg: "bg-orange-500/10",
  },
];

const PARTY_GAMES = [
  {
    href: "/werewolf",
    title: "Ma Sói",
    subtitle: "Werewolf",
    iconUrl: "/icons/werewolf.png",
    bgGradient: "from-indigo-500/10 to-indigo-500/0",
    borderGlow: "group-hover:border-indigo-500/30",
    iconBg: "bg-indigo-500/10",
  },
  {
    href: "/uno",
    title: "Bài Uno",
    subtitle: "Uno",
    iconUrl: "/icons/uno.png",
    bgGradient: "from-fuchsia-500/10 to-fuchsia-500/0",
    borderGlow: "group-hover:border-fuchsia-500/30",
    iconBg: "bg-fuchsia-500/10",
  },
  {
    href: "/exploding-kittens",
    title: "Mèo Nổ",
    subtitle: "Exploding Kittens",
    iconUrl: "/icons/exploding_kittens.png",
    bgGradient: "from-red-600/10 to-red-600/0",
    borderGlow: "group-hover:border-red-600/30",
    iconBg: "bg-red-600/10",
  },
  {
    href: "/battleship",
    title: "Bắn Thuyền",
    subtitle: "Battleship",
    iconUrl: "/icons/battleship.png",
    bgGradient: "from-blue-500/10 to-blue-500/0",
    borderGlow: "group-hover:border-blue-500/30",
    iconBg: "bg-blue-500/10",
  },
];

const FEATURES = [
  {
    title: "Thời gian thực (Real-time)",
    desc: "Tốc độ phản hồi tính bằng mili-giây. Trải nghiệm chơi mượt mà như đánh offline.",
    icon: <Zap className="w-6 h-6 text-yellow-500" />
  },
  {
    title: "Chơi Ngay Không Cần Tải",
    desc: "Truy cập trực tiếp trên trình duyệt điện thoại và máy tính. Không cần cài đặt ứng dụng.",
    icon: <Globe2 className="w-6 h-6 text-blue-500" />
  },
  {
    title: "Kết Nối Bạn Bè Nhanh Chóng",
    desc: "Chỉ cần 1 click để tạo phòng, gửi Link và mời bạn bè tham gia ngay lập tức.",
    icon: <Users className="w-6 h-6 text-emerald-500" />
  }
];

const STEPS = [
  {
    step: "1",
    title: "Chọn Trò Chơi",
    desc: "Khám phá bộ sưu tập board game và party game phong phú."
  },
  {
    step: "2",
    title: "Tạo Phòng",
    desc: "Nhấn 'Tạo phòng mới' hoặc tham gia phòng sẵn có bằng Mã (Room ID)."
  },
  {
    step: "3",
    title: "Gửi Link & Chơi",
    desc: "Sao chép link phòng, gửi cho bạn bè và bắt đầu tranh tài!"
  }
];

export default function LandingPage() {
  const scrollToGames = () => {
    document.getElementById("game-collection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/30 font-sans overflow-hidden">

      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-rose-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px] mix-blend-multiply" />
      </div>



      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-16 md:pt-16 md:pb-20 px-4 min-h-[90vh] flex items-center justify-center">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center w-full">

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", type: "spring", bounce: 0.4 }}
            className="mb-6 relative flex flex-col items-center"
          >
            <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full scale-[2.0]" />
            <Image src="/logo.png" alt="Boardgame Portal Logo" width={160} height={160} className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)] mb-4" />
            <span className="relative z-10 text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Boardgame Portal</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Nền tảng Board Game Thế hệ mới</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.1]"
          >
            Giải trí Cùng Bạn Bè <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600">
              Mọi Lúc, Mọi Nơi
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mb-8 leading-relaxed px-4"
          >
            Trải nghiệm hàng chục trò chơi Board Game và Party Game hấp dẫn nhất.
            Không cần cài đặt, không cần đăng ký phức tạp. Chỉ cần tạo phòng và chiến!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={scrollToGames}
              className="w-full sm:w-auto group relative flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 cursor-pointer"
            >
              <Gamepad2 className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              Khám Phá Trò Chơi
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all hover:shadow-md active:scale-95 cursor-pointer"
            >
              Cách Chơi
            </a>
          </motion.div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative z-10 py-20 bg-white/50 backdrop-blur-xl border-y border-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tại sao chọn Boardgame Portal?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Thiết kế tối giản, công nghệ hiện đại, mang lại trải nghiệm chơi game tuyệt vời nhất cho bạn và bạn bè.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GAME COLLECTION SECTION */}
      <section id="game-collection" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-16 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 mb-6">
              <Swords className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Kho Trò Chơi</h2>
            <p className="text-lg text-slate-600 max-w-2xl">Lựa chọn trò chơi bạn yêu thích và bắt đầu so tài cùng hàng ngàn kỳ thủ khác.</p>
          </div>

          {/* Cờ Truyền Thống */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h3 className="text-2xl font-bold text-slate-800">Cờ Truyền Thống</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {BOARD_GAMES.map((game, i) => (
                <GameCard key={i} game={game} index={i} />
              ))}
            </div>
          </div>

          {/* Party Games */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <PartyPopperIcon className="w-6 h-6 text-fuchsia-500" />
              <h3 className="text-2xl font-bold text-slate-800">Party Games & Giải Trí</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {PARTY_GAMES.map((game, i) => (
                <GameCard key={i} game={game} index={i} />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-24 mt-10 overflow-hidden">
        {/* Background Gradients for this section */}
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-6"
            >
              <Zap className="w-4 h-4" />
              <span>Nhanh Chóng & Dễ Dàng</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Bắt Đầu Chỉ Trong <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">3 Bước</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Không cần đăng ký rườm rà. Hệ thống được thiết kế để bạn và bạn bè có thể lao vào cuộc chiến ngay lập tức.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0" />

            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative flex flex-col group"
              >
                <div className="relative z-10 flex flex-col items-center p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
                  {/* Step Number Badge */}
                  <div className="absolute -top-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[2px] shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400">
                        0{s.step}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">{s.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-950 text-slate-500 py-10 text-center text-sm border-t border-slate-800">
        <p>© 2026 Boardgame Portal. All rights reserved.</p>
        <p className="mt-2">Built with Next.js, TailwindCSS & Supabase.</p>
      </footer>

    </div>
  );
}

function GameCard({ game, index }: { game: any, index: number }) {
  return (
    <Link href={game.href} className="group block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
        className={`relative h-full overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${game.borderGlow}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${game.bgGradient}`} />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm overflow-hidden ${game.iconBg}`}>
              {game.iconUrl ? (
                <Image src={game.iconUrl} alt={game.title} fill className="object-cover scale-110" />
              ) : (
                <span className="text-2xl">{game.icon}</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="mb-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
              {game.title}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {game.subtitle}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function PartyPopperIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.91 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
    </svg>
  );
}
