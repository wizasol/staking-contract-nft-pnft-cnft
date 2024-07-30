"use client";

import React from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";

const SkeletonImage = () => {
  const { connected } = useWallet();
  const searchParams = useSearchParams();
  return (
    <>
      <Image
        src="/img/dashboard/skull.png"
        width={594}
        height={626}
        alt="Skeleton"
        className="md:min-w-[594px] md:h-[626px] h-auto md:max-h-none max-h-[60vh] w-auto  absolute bottom-0 md:bottom-[-1.75rem] animate-skeleton"
      />
      {!connected && (
        <div className="absolute bottom-[60vw] md:bottom-[450px]">
          <div className="text-[28px] md:text-[45px] flex gap-4 ">
            <p className="animate-connect">Connect</p>
            <p className="animate-your">Your</p>
            <p className="animate-fcking">F*cking</p>
            <p className="animate-wallet">Wallet</p>
          </div>
        </div>
      )}
    </>
  );
};

/* (searchParams.get("callbackUrl") ? (
          <div className="absolute bottom-[75vw] md:bottom-[450px]">
            <p className=" text-[45px] md:text-[55px] font-bold text-primary animate-said">
              I SAID
            </p>
            <div className="text-[28px] md:text-[45px] flex gap-4 ">
              <p className="animate-connect">Connect</p>
              <p className="animate-your">Your</p>
              <p className="animate-fcking">F*cking</p>
              <p className="animate-wallet">Wallet !</p>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-[75vw] md:bottom-[450px] animate-dash-text">
            <p className=" text-[28px] md:text-[45px] ">
              Connect Your F*cking Wallet
            </p>
          </div>
        )) */
/* <>
      <Image
        src="/img/dashboard/skull.png"
        width={594}
        height={626}
        alt="Skeleton"
        className="md:min-w-[594px] md:h-[626px] min-w-[100vw] h-auto  absolute bottom-0 md:bottom-[-1.75rem] animate-skeleton"
      />
      {!connected && (
        <div className="absolute bottom-[75vw]  md:bottom-[450px] animate-dash-text">
          <p className=" text-[28px] md:text-[45px]">
            Connect Your F*cking Wallet
          </p>
        </div>
      )}
    </> */
export default SkeletonImage;
