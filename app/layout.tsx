import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlackMamba",
  description: "Generador de audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
