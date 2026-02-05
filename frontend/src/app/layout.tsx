import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceSettingsProvider } from "@/contexts/VoiceSettingsContext";

export const metadata: Metadata = {
  title: "Voice AI Platform - Intelligent Customer Experience",
  description: "Advanced voice AI agent platform for customer support, sales, and engagement. Powered by LangGraph and Google Gemini.",
  keywords: ["voice AI", "customer support", "AI agents", "conversational AI", "LangGraph", "Gemini"],
  authors: [{ name: "Voice AI Platform Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased min-h-screen"
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <AuthProvider>
            <VoiceSettingsProvider>
              <Navigation />
              <main className="pt-16">
                {children}
              </main>
            </VoiceSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
