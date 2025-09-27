import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@mysten/dapp-kit/dist/index.css';
import Providers from '@/components/Providers';
import '@/lib/pixel-retroui-setup.js';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WalrusCanvas AI - Decentralized Design Tool",
  description: "AI-powered decentralized design tool with encrypted storage using Walrus and Seal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
