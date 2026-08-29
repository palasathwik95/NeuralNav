import type { Metadata } from "next";
import AssistantPage from "@/components/assistant/AssistantPage";

export const metadata: Metadata = {
  title: "AI Learning Mentor — Trailhead",
  description:
    "Your personal AI guide for learning, projects, skills, and career goals.",
};

// This is a Server Component wrapper. AssistantPage itself is a Client
// Component ("use client") that handles all interactive state. Keeping the
// page as a Server Component lets Next.js apply its metadata and streaming
// optimisations cleanly.
export default function AssistantRoute() {
  return <AssistantPage />;
}
