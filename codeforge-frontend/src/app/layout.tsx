import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "CodeForge",
  description: "Execution system for developers.",
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