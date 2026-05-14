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
          colorNeutral: "#F2EFE8",
          colorForeground: "#F2EFE8",
          colorMuted: "rgba(242, 239, 232, 0.08)",
          colorMutedForeground: "#B8B2A8",
          colorText: "#F2EFE8",
          colorTextSecondary: "#8E8B83",
          colorInputBackground: "rgba(242, 239, 232, 0.04)",
          colorInputText: "#F2EFE8",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui",
        },
        elements: {
          rootBox: "text-foreground",
          cardBox: "border border-border bg-background-elevated text-foreground shadow-2xl shadow-black/30",
          modalBackdrop: "bg-black/70 backdrop-blur-sm",
          pageScrollBox: "bg-background-elevated text-foreground",
          navbar: "border-r border-border bg-[#101117]",
          navbarButton:
            "text-foreground/80 hover:bg-white/5 hover:text-foreground data-[active=true]:bg-white/6 data-[active=true]:text-primary",
          navbarButtonText:
            "text-foreground/80 group-data-[active=true]:text-primary",
          navbarButtonIcon:
            "text-muted-foreground group-data-[active=true]:text-primary",
          userButtonPopoverCard:
            "border border-border bg-background-elevated text-foreground shadow-2xl shadow-black/35",
          userButtonPopoverMain: "bg-background-elevated text-foreground",
          userButtonPopoverActions: "bg-background-elevated text-foreground",
          userButtonPopoverActionButton:
            "text-foreground hover:bg-white/5 hover:text-foreground",
          userButtonPopoverActionButtonIcon: "text-muted-foreground",
          userButtonPopoverFooter:
            "border-t border-border bg-[rgba(255,107,53,0.08)] text-foreground/90",
          userPreviewTextContainer: "text-foreground",
          userPreviewMainIdentifier: "text-foreground",
          userPreviewMainIdentifierText: "text-foreground font-medium",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
          profileSectionTitle: "text-foreground",
          profileSectionTitleText: "text-foreground font-semibold",
          profileSectionSubtitle: "text-muted-foreground",
          profileSectionSubtitleText: "text-muted-foreground",
          profileSectionContent: "text-foreground",
          profileSectionPrimaryButton:
            "text-primary hover:text-[#FF8A5F] font-semibold",
          formFieldLabel: "text-foreground/90",
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
