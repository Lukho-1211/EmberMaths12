import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
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
  title: "Ember Maths12 | CAPS Grade 12 Mathematics",
  description:
    "Online South African CAPS Grade 12 Mathematics school — terms, weekly lessons, Saturday tests, and parent progress tracking.",
};

async function resolveInitialTheme(): Promise<"light" | "dark"> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "light";
    const { data } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle();
    return data?.theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await resolveInitialTheme();
  const htmlClass = [
    outfit.variable,
    fraunces.variable,
    "h-full antialiased",
    theme === "dark" ? "dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
