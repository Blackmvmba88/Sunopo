import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunopo Studio",
  description: "Professional catalog, metadata, and distribution workspace for Suno creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
