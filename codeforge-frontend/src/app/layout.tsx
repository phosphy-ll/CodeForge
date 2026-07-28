import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "CodeForge — Proof-based execution for developers",
  description:
    "CodeForge helps developers learn through daily tasks, AI review, proof-based progress, and execution pressure.",

  metadataBase: new URL("https://codeforgeapp.com"),

  openGraph: {
    title: "CodeForge — Stop pretending you're learning to code",
    description:
      "Daily coding tasks. AI verification. Proof-based progress. No fake streaks.",
    url: "https://codeforgeapp.com",
    siteName: "CodeForge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeForge",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "CodeForge",
    description: "Proof-based execution platform for developers.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/logo-mark-up.svg",
    shortcut: "/logo-mark-up.svg",
    apple: "/logo-mark-up.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-[var(--cf-bg)] text-[var(--cf-text)] antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}