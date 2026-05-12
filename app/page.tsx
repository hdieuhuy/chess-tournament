import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-zinc-900 selection:bg-zinc-200">
      <div className="max-w-3xl text-center">
        {/* Tiêu đề chính */}
        <h1 className="mb-6 text-5xl font-light tracking-tight md:text-7xl font-[family-name:var(--font-playfair)]">
          BoardGame <span className="font-semibold">Portal</span>
        </h1>

        {/* Đoạn mô tả */}
        <p className="mb-10 text-lg font-light leading-relaxed text-zinc-500 md:text-xl">
          Trải nghiệm các bộ môn cờ kinh điển ngay trên trình duyệt. Kết nối
          nhanh chóng, giao diện tối giản — nơi tôn vinh những ván đấu trí đỉnh
          cao cùng bạn bè mà không cần cài đặt.
        </p>

        {/* Danh sách Game */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Cờ Caro */}
          <Link
            href="/gomoku"
            className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
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
            className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
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
            className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-3xl font-bold text-red-600 transition-colors group-hover:bg-zinc-100">
              帥
            </div>
            <h3 className="text-lg font-medium text-zinc-900">Cờ Tướng</h3>
            <p className="mt-2 text-sm text-zinc-500">Xiangqi</p>
          </Link>

          {/* Bắn Thuyền */}
          <Link
            href="/battleship"
            className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md"
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
  );
}
