import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { UiProvider } from "@/components/ui/UiProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";
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
  applicationName: "Alpha Portal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alpha Portal",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/alpha-logo.png", type: "image/png" }],
    apple: [{ url: "/alpha-logo.png" }],
    shortcut: ["/alpha-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="min-h-screen antialiased">
        <UiProvider>
          {children}
          <PwaRegister />
        </UiProvider>
      </body>
    </html>
  );
}
