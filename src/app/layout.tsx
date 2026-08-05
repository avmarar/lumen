import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const serifFont = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumen — Calm, Time-Aware Personal Planner",
  description: "A local-first personal planner for todos, checklists, reminders, and week planning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-amber-50/20 text-stone-800 selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
