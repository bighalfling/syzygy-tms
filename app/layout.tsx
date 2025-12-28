import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/app-header";
import AuthSessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SYZYGY-LOG TMS",
  description: "tms@syzygy-log.com",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}>
        <AuthSessionProvider>
          <div className="min-h-screen bg-muted/40">
            <AppHeader />

            {/* Unified app container */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
