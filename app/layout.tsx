import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlackMamba",
  description: "Audio generation app with Suno-inspired layout",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
