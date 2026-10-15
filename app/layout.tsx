import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
// Fonts are bundled locally through Fontsource.
import "@fontsource/michroma/latin-400.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "COMPUTER",
  description:
    "Travel into the machine: from the processor to the history of computing, the anatomy of a desktop PC, its motherboard, and how a game goes from files on a drive to a running process on the CPU and GPU.",
  applicationName: "COMPUTER",
  keywords: ["computer", "CPU", "history of computing", "motherboard", "operating system", "process", "threads", "von Neumann architecture"],
  openGraph: {
    title: "COMPUTER",
    description: "An immersive, scroll-driven journey into computing.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
