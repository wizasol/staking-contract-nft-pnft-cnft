"use client";

import React from "react";
import Image from "next/image";
import Button from "./Button";
import { type } from "os";
import { useWallet } from "@solana/wallet-adapter-react";

type DashboardSectionProps = {
  text: string;
  disabled?: boolean;
  image: string;
  redirect: string;
  index: number;
};

const DashboardSection = ({
  text,
  disabled = false,
  image,
  redirect,
  index,
}: DashboardSectionProps) => {
  const { connected } = useWallet();
  return (
    <a
      href={redirect}
      className="relative w-full max-w-[400px] h-fit hover:scale-[101%] hover:shadow-lg cursor-pointer transition-all duration-300 group rounded-xl animate-dash-section opacity-0"
      style={{ animationDelay: `${(index + 1) * 0.25}s` }}
    >
      <Image
        src={image}
        width={400}
        height={184}
        alt={text}
        className={`${
          disabled ? "filter grayscale" : " "
        } border border-black h-auto w-full rounded-xl transform  transition-all duration-300 ease-in-out `}
      />
      <div className="absolute bottom-2 left-2 pointer-events-none">
        {disabled ? (
          <Button text={text} variant="secondary" disabled />
        ) : (
          <Button text={text} disabled />
        )}
      </div>
    </a>
  );
};
{
  //QUESTO MANTIENE LE DIMENSIONI DELL'IMMAGINE
  /* <div className="relative">
      <Image
        src={image}
        width={400}
        height={184}
        alt="Loyalty Program"
        className={`${
          disabled && "filter grayscale"
        } w-[400px] border border-black h-[184px] rounded-xl`}
      />
      <div className="absolute bottom-2 left-2">
        {disabled ? (
          <Button text={text} variant="secondary" disabled />
        ) : (
          <Button text={text} />
        )}
      </div>
    </div> */
}
export default DashboardSection;
