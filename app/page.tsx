import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 selection:bg-zinc-200">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="flex max-w-3xl flex-col items-center text-center">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="BoardGame Portal Logo"
            width={240}
            height={240}
            className="mb-6"
          />

          {/* Tiêu đề chính */}
          <h1 className="mb-6 text-5xl font-light tracking-tight md:text-7xl">
            BoardGame <span className="font-semibold">Portal</span>
          </h1>

          {/* Đoạn mô tả */}
          <p className="mb-10 text-lg font-light leading-relaxed text-zinc-500 md:text-xl">
            Trải nghiệm các bộ môn cờ kinh điển ngay trên trình duyệt. Kết nối
            nhanh chóng, giao diện tối giản — nơi tôn vinh những ván đấu trí
            đỉnh cao cùng bạn bè mà không cần cài đặt.
          </p>

          {/* Danh sách Game */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {/* Cờ Caro */}
            <Link
              href="/gomoku"
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-2xl transition-colors group-hover:bg-zinc-100">
                <span className="font-bold text-green-600">X</span>
                <span className="font-bold text-red-500">O</span>
              </div>
              <h3 className="text-lg font-medium text-zinc-900">Cờ Caro</h3>
              <p className="mt-2 text-sm text-zinc-500">Gomoku</p>
            </Link>

            {/* Cờ Vua */}
            <Link
              href="/chess"
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-3xl transition-colors group-hover:bg-zinc-100">
                ♚
              </div>
              <h3 className="text-lg font-medium text-zinc-900">Cờ Vua</h3>
              <p className="mt-2 text-sm text-zinc-500">Chess</p>
            </Link>

            {/* Cờ Tướng */}
            <Link
              href="/xiangqi"
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-3xl font-bold text-red-600 transition-colors group-hover:bg-zinc-100">
                帥
              </div>
              <h3 className="text-lg font-medium text-zinc-900">Cờ Tướng</h3>
              <p className="mt-2 text-sm text-zinc-500">Xiangqi</p>
            </Link>

            {/* Cờ Vây */}
            <Link
              href="/go"
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-3xl transition-colors group-hover:bg-zinc-100">
                ⚫⚪
              </div>
              <h3 className="text-lg font-medium text-zinc-900">Cờ Vây</h3>
              <p className="mt-2 text-sm text-zinc-500">Go</p>
            </Link>
            {/* Bắn Thuyền */}
            <Link
              href="/battleship"
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-3xl transition-colors group-hover:bg-zinc-100">
                🚢
              </div>
              <h3 className="text-lg font-medium text-zinc-900">Bắn Thuyền</h3>
              <p className="mt-2 text-sm text-zinc-500">Battleship</p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-100 py-6 text-center text-sm text-zinc-500">
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
