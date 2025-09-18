import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import OptimizedNavigation from "@/components/navigation/OptimizedNavigation";
import Footer from "@/components/footer/Footer";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://megavibe.app"
  ),
  title: "MegaVibe - The Stage",
  description:
    "The Stage for Live Performance Economy - Connect with performers, create bounties, and tip your favorite artists in the decentralized live performance ecosystem.",
  keywords:
    "performers, live performance, content creation, tipping, bounties, web3, blockchain, decentralized, artists, musicians",
  authors: [{ name: "MegaVibe Team" }],
  creator: "MegaVibe",
  publisher: "MegaVibe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/images/megavibe.png",
  },
  openGraph: {
    title: "MegaVibe - The Stage",
    description:
      "The Stage for Live Performance Economy - Connect with performers, create bounties, and tip your favorite artists.",
    url: "https://megavibe.app",
    siteName: "MegaVibe",
    images: [
      {
        url: "/images/megavibe.png",
        width: 1200,
        height: 630,
        alt: "MegaVibe - The Stage for Live Performance Economy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MegaVibe - The Stage",
    description:
      "The Stage for Live Performance Economy - Connect with performers, create bounties, and tip your favorite artists.",
    images: ["/images/megavibe.png"],
    creator: "@megavibe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  manifest: "/manifest.json",
};

import { FilCDNProvider } from "@/contexts/FilCDNContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BlockchainProvider } from "@/components/layout/BlockchainProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import MobileLayout from "@/components/mobile/MobileLayout";
import { ClientOnlyWeb3Provider } from "@/components/providers/ClientOnlyWeb3Provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <ErrorBoundary>
          <ClientOnlyWeb3Provider>
            <FilCDNProvider>
              <WalletProvider>
                <BlockchainProvider>
                  <MobileLayout>
                    <OptimizedNavigation />
                    {children}
                    <Footer />
                  </MobileLayout>
                </BlockchainProvider>
              </WalletProvider>
            </FilCDNProvider>
          </ClientOnlyWeb3Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
