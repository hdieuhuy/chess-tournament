import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "BoardGame Portal",
  description: "Nền tảng tổ chức giải đấu cờ vua, cờ tướng, cờ vây nội bộ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body
        className={`min-h-full flex flex-col font-sans ${beVietnamPro.className}`}
      >
        {children}
      </body>
    </html>
  );
}
