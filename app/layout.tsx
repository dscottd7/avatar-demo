import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kai - AI Avatar",
  description: "Real-time conversational AI avatar powered by HeyGen and OpenAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
