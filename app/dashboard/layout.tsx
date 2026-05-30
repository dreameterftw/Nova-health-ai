"use client";

import { EmotionProvider } from "@/contexts/EmotionContext";
import { ChatProvider } from "@/contexts/ChatContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmotionProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </EmotionProvider>
  );
}
