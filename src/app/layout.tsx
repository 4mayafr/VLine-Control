import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "V/LINE CONTROL — Connecting Victoria. Monitoring the Network.",
    template: "%s · V/LINE CONTROL",
  },
  description:
    "An independent railway monitoring and information platform for Victorian regional rail corridors. Unofficial and not affiliated with V/Line.",
  applicationName: "V/LINE CONTROL",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body className="app-bg min-h-screen antialiased">{children}</body>
    </html>
  );
}
