import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ember12 | CAPS Grade 12 Mathematics",
  description:
    "Online South African CAPS Grade 12 Mathematics school — terms, weekly lessons, Saturday tests, and parent progress tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
