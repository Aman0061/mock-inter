import type { Metadata } from "next";
import { Geologica, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { dark } from "@clerk/themes";
import { Providers } from "./providers";
import "./globals.css";

const sans = Geologica({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MockBuddy — подготовка к собеседованиям для Product Manager-ов",
  description:
    "Маркетплейс mock-интервью с AI-тренажёром и PM-ами из Яндекса, Kaspi, Ozon, Тинькофф и Google. Готовься к собеседованию и получай честный фидбек.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={ruRU}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#FF6B35",
          colorBackground: "#13141A",
          colorText: "#F2EFE8",
          colorTextSecondary: "#8E8B83",
          colorInputBackground: "rgba(242, 239, 232, 0.04)",
          colorInputText: "#F2EFE8",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui",
        },
      }}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="ru"
        className={`${sans.variable} ${display.variable} ${mono.variable} dark`}
      >
        <body className="min-h-screen bg-background text-foreground antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
