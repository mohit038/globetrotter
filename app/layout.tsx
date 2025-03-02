import "./globals.css";
import { Inter } from "next/font/google";

export const metadata = {
  metadataBase: new URL("https://globetrotter.vercel.app"),
  title: "Globetrotter - Test Your Geography Knowledge",
  description:
    "Challenge yourself with geography puzzles and test your knowledge of world destinations in this fun interactive game.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
