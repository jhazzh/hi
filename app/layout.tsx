import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./index.css";
import "./App.css";
import Chrome from "../components/Chrome";

export const metadata: Metadata = {
  title: "Web",
  description: "A portfolio of small self-contained web apps.",
};

export const viewport: Viewport = {
  themeColor: "#6de",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint (dark default) to avoid a flash. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {"(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();"}
        </Script>
        <Script
          src="https://kit.fontawesome.com/23cc219af3.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Shared design tokens + fonts (also used by the quiz sub-app). */}
        <link rel="stylesheet" href="/hi/theme.css" />
      </head>
      <body>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
