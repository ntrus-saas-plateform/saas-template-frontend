import { Source_Sans_3, JetBrains_Mono, Syne } from "next/font/google";
import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const signInDisplay = Syne({
  variable: "--font-signin-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Platform Edge",
  description: "Enterprise ERP application shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${jetbrains.variable} ${signInDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
