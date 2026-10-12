import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MindMate — AI Mental Health & Somatic Wellness Companion",
  description:
    "An empathetic, AI-powered mental health companion featuring real-time streaming dialogue, somatic box breathing, 5-4-3-2-1 grounding, mood analytics, and proactive crisis guardrails.",
  keywords: [
    "Mental Health AI",
    "MindMate",
    "Somatic Wellness",
    "Gemini AI",
    "Next.js 16",
    "Mood Tracker",
    "Cognitive Behavioral Therapy",
    "Crisis Support",
  ],
  authors: [{ name: "MindMate Engineering" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
