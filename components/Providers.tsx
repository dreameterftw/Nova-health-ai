"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { EmotionProvider } from "@/contexts/EmotionContext";
import { ChatProvider } from "@/contexts/ChatContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <EmotionProvider>
          {children}
        </EmotionProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
