import Link from "next/link";
import Image from "next/image";

const GAMES = [
  {
    href: "/gomoku",
    title: "Cờ Caro",
    subtitle: "Gomoku",
    icon: (
      <>
        <span className="font-bold text-green-600">X</span>
        <span className="font-bold text-red-500">O</span>
      </>
    ),
    iconClassName: "text-xl",
  },
  {
    href: "/chess",
    title: "Cờ Vua",
    subtitle: "Chess",
    icon: "♚",
    iconClassName: "text-2xl",
  },
  {
    href: "/xiangqi",
    title: "Cờ Tướng",
    subtitle: "Xiangqi",
    icon: "帥",
    iconClassName: "text-2xl font-bold text-red-600",
  },
  {
    href: "/go",
    title: "Cờ Vây",
    subtitle: "Go",
    icon: "⚫⚪",
    iconClassName: "text-2xl",
  },
  {
    href: "/battleship",
    title: "Bắn Thuyền",
    subtitle: "Battleship",
    icon: "🚢",
    iconClassName: "text-2xl",
  },
  {
    href: "/werewolf",
    title: "Ma Sói",
    subtitle: "Werewolf",
    icon: "🐺",
    iconClassName: "text-2xl",
  },
  {
    href: "/oanquan",
    title: "Ô Ăn Quan",
    subtitle: "O An Quan",
    icon: "🪨",
    iconClassName: "text-2xl",
  },
  {
    href: "/jungle",
    title: "Cờ Thú",
    subtitle: "Jungle",
    icon: "🦁",
    iconClassName: "text-2xl",
  },
  {
    href: "/checkers",
    title: "Cờ Đam",
    subtitle: "Checkers",
    icon: "🔴",
    iconClassName: "text-2xl",
  },
  {
    href: "/uno",
    title: "Bài Uno",
    subtitle: "Uno",
    icon: "🃏",
    iconClassName: "text-2xl",
  },
];

export default function LandingPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-zinc-900 selection:bg-zinc-200">
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6">
        <div className="flex max-w-3xl flex-col items-center text-center">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="BoardGame Portal Logo"
            width={160}
            height={160}
            className="mb-4 w-32 md:mb-6 md:w-40"
          />

          {/* Tiêu đề chính */}
          <h1 className="mb-4 text-4xl font-light tracking-tight md:text-6xl">
            BoardGame <span className="font-semibold">Portal</span>
          </h1>

          {/* Đoạn mô tả */}
          <p className="mb-8 text-base font-light leading-relaxed text-zinc-500 md:text-lg">
            Nơi hội tụ những bộ môn thể thao trí tuệ hàng đầu. Khám phá các bàn
            cờ kinh điển, thách thức bạn bè và thể hiện bản lĩnh qua từng ván
            đấu trực tuyến mượt mà.
          </p>

          {/* Danh sách Game */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 transition-colors group-hover:bg-zinc-100 ${game.iconClassName}`}
                >
                  {game.icon}
                </div>
                <h3 className="text-base font-medium text-zinc-900">
                  {game.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{game.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-100 py-4 text-center text-sm text-zinc-500">
        <p>
          © {new Date().getFullYear()} BoardGame Portal. All rights reserved.
        </p>
        <p className="mt-1">
          Được xây dựng bởi{" "}
          <span className="font-medium text-zinc-800">Diệu Huy ( CoeS )</span>.
        </p>
      </footer>
    </div>
  );
}
