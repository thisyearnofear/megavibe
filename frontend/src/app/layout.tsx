import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import Navigation from "@/components/navigation/Navigation";
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
  title: "MegaVibe - The Stage",
  description: "The Stage for Live Performance Economy",
  keywords: "performers, live performance, content creation, tipping, bounties",
};

import { FilCDNProvider } from "@/contexts/FilCDNContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BlockchainProvider } from "@/components/layout/BlockchainProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <FilCDNProvider>
          <WalletProvider>
            <BlockchainProvider>
              <Navigation />
              {children}
              <Footer />
            </BlockchainProvider>
          </WalletProvider>
        </FilCDNProvider>
      </body>
    </html>
  );
}
