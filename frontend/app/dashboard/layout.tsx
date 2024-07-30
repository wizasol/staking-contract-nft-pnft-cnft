"use client";

import type { Metadata } from "next";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { Toaster } from "sonner";

/* export const metadata: Metadata = {
  title: "Bozo Collective - Dashboard",
  description:
    "Bozo Collective is a collection with art inspired by Diary of a Wimpy Kid. Created to remind the community that we are all Bozos and we are all in this together.",
}; */

// import the styles
require("@solana/wallet-adapter-react-ui/styles.css");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* const solNetwork =
    process.env.NODE_ENV === "development"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet; */
  const solNetwork = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(solNetwork), [solNetwork]);
  // initialise all the wallets you want to use
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),

      new SolflareWalletAdapter({ network: solNetwork }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [solNetwork]
  );
  const toastOptions = {
    duration: 1000,
    style: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
    },
  };
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={toastOptions} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
