"use client";

import React from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Button from "./Button";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import WalletButton from "./WalletButton";
import PointCounter from "./PointCounter";
import { useSession } from "next-auth/react";

type WalletComponentsProps = {
  points?: number;
};

const WalletComponents = ({ points }: WalletComponentsProps) => {
  const wallet = useWallet();

  const { data: session, status } = useSession();

  return (
    <div className="relative flex gap-2 h-fit">
      {wallet.connected && status == "authenticated" && (
        <PointCounter points={points || session?.user.claimedPoints || 0} />
      )}
      <WalletButton />
    </div>
  );
};

export default WalletComponents;
