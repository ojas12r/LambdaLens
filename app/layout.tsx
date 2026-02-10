import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "cal-sans";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const pjs = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-pjs" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const gnomon = localFont({ src: "./fonts/gnomon-web.ttf", variable: "--font-gnomon" });

export const metadata: Metadata = {
  title: "Aegis — AI Cloud Cost Anomaly Detection",
  description:
    "AI-powered cloud cost anomaly detection. Finds the spike, reads the logs, tells you exactly what broke and how to fix it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${pjs.variable} ${outfit.variable} ${gnomon.variable} font-sans antialiased bg-[#0C0C0C] text-slate-100`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange forcedTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}