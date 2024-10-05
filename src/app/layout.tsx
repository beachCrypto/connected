import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Base Channel News",
  description: "A Hacker News-style site for Base",
  openGraph: {
    title: "Base ChannelNews",
    description: "A Hacker News-style site for Base",
    images: [
      {
        url: "https://raw.githubusercontent.com/base-org/brand-kit/refs/heads/main/logo/in-product/Base_Network_Logo.png",
        width: 1200,
        height: 630,
        alt: "Base Channel News",
      },
    ],
    url: "https://connected-fc.pages.dev/",
    siteName: "Base ChannelNews",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Channel News",
    description: "A Hacker News-style site for Base",
    images: ["https://raw.githubusercontent.com/base-org/brand-kit/refs/heads/main/logo/in-product/Base_Network_Logo.png"],
    creator: "@beachcrypto_eth",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
