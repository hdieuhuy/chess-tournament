import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${firaSans.variable} h-full antialiased`}>
      <body
        className={`min-h-full flex flex-col font-sans ${firaSans.className}`}
      >
        {children}
      </body>
    </html>
  );
}
