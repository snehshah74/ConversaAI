import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
            <main className="pt-16">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
