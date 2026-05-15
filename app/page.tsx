import Link from "next/link";
import Image from "next/image";

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
            {/* Cờ Caro */}
            <Link
              href="/gomoku"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-xl transition-colors group-hover:bg-zinc-100">
                <span className="font-bold text-green-600">X</span>
                <span className="font-bold text-red-500">O</span>
              </div>
              <h3 className="text-base font-medium text-zinc-900">Cờ Caro</h3>
              <p className="mt-1 text-xs text-zinc-500">Gomoku</p>
            </Link>

            {/* Cờ Vua */}
            <Link
              href="/chess"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                ♚
              </div>
              <h3 className="text-base font-medium text-zinc-900">Cờ Vua</h3>
              <p className="mt-1 text-xs text-zinc-500">Chess</p>
            </Link>

            {/* Cờ Tướng */}
            <Link
              href="/xiangqi"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl font-bold text-red-600 transition-colors group-hover:bg-zinc-100">
                帥
              </div>
              <h3 className="text-base font-medium text-zinc-900">Cờ Tướng</h3>
              <p className="mt-1 text-xs text-zinc-500">Xiangqi</p>
            </Link>

            {/* Cờ Vây */}
            <Link
              href="/go"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                ⚫⚪
              </div>
              <h3 className="text-base font-medium text-zinc-900">Cờ Vây</h3>
              <p className="mt-1 text-xs text-zinc-500">Go</p>
            </Link>

            {/* Bắn Thuyền */}
            <Link
              href="/battleship"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                🚢
              </div>
              <h3 className="text-base font-medium text-zinc-900">
                Bắn Thuyền
              </h3>
              <p className="mt-1 text-xs text-zinc-500">Battleship</p>
            </Link>

            {/* Ma Sói */}
            <Link
              href="/werewolf"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                🐺
              </div>
              <h3 className="text-base font-medium text-zinc-900">Ma Sói</h3>
              <p className="mt-1 text-xs text-zinc-500">Werewolf</p>
            </Link>

            {/* Ô Ăn Quan */}
            <Link
              href="/oanquan"
              className="group flex w-[calc(50%-8px)] flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md sm:w-[calc(33.333%-11px)] md:w-[calc(33.333%-11px)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                🪨
              </div>
              <h3 className="text-base font-medium text-zinc-900">Ô Ăn Quan</h3>
              <p className="mt-1 text-xs text-zinc-500">O An Quan</p>
            </Link>
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
