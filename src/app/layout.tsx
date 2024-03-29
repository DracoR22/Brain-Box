export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DM_Sans } from 'next/font/google';
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { twMerge } from "tailwind-merge";
import { Toaster } from "@/components/ui/toaster";
import AppStateProvider from "@/lib/providers/state-provider";
import { SupabaseUserProvider } from "@/lib/providers/supabase-user-provider";
import { SocketProvider } from "@/lib/providers/socket-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Brain Box",
  description: "Create notes and collaborate in real time with your team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={twMerge('bg-background', inter.className)}>
         <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppStateProvider>
            <SupabaseUserProvider>
              <SocketProvider>
              <Toaster/>
              {children}
              </SocketProvider>
            </SupabaseUserProvider>
          </AppStateProvider>
         </ThemeProvider>
      </body>
    </html>
  );
}
