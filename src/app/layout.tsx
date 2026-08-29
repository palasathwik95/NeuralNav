import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trailhead — Personalized Learning Path Recommender",
  description: "Conversational mentor and dashboard for your learning path.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
