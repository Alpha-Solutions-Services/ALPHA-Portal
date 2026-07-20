import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Portal — Client & Admin",
  description:
    "Alpha Solutions client and admin portal for projects, tickets, and support.",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/alpha-logo.png", type: "image/png" }],
    apple: [{ url: "/alpha-logo.png" }],
    shortcut: ["/alpha-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
