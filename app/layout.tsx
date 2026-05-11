import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
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
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col font-sans ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
