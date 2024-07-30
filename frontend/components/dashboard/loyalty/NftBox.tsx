"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "../Button";
import Nft from "./Nft";
import { NftType } from "@/app/dashboard/loyalty/page";
import { useLoyalty } from "@/app/context/LoyaltyContext";

type NftBoxProps = {
  nfts: NftType[];
  unstakeNft: (nft_id: string) => void;
  stakeAllNfts: () => void;
  isNftsDraggable: Map<string, boolean>;
};

function getRandomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const NftBox = ({
  nfts,
  unstakeNft,
  stakeAllNfts,
  isNftsDraggable,
}: NftBoxProps) => {
  const boxRef = useRef<HTMLImageElement | null>(null);

  const { isGlobalDragging, setIsGlobalDragging } = useLoyalty();

  const [bounds, setBounds] = React.useState({} as DOMRect);

  const [nftsPositions, setNftsPositions] = React.useState<
    { nft_id: string; x: number; y: number }[]
  >([]);

  useEffect(() => {
    const box = boxRef.current;
    if (box) {
      const boxBounds = box.getBoundingClientRect();
      setBounds(boxBounds);
    }
  }, []);

  useEffect(() => {
    //when nfts change find the nft that are not in nftsPositions and add them

    const newNftsPositions = nfts.map((nft) => {
      const nftPosition = nftsPositions.find((n) => n.nft_id == nft.id);

      if (nftPosition) {
        return nftPosition;
      } else {
        return {
          nft_id: nft.id,
          x: getRandomNumber(0, bounds.width - 120),
          y: getRandomNumber(0, bounds.height - 120),
        };
      }
    });

    setNftsPositions(newNftsPositions);
  }, [nfts]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("dragging over");
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("DROPPING");
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    console.log(x, y);

    setIsGlobalDragging(false);

    const nft_id = e.dataTransfer.getData("nft");

    let newPositions = nftsPositions.filter((n) => n.nft_id != nft_id);

    let newX = x;
    let newY = y;

    if (x < 70) newX = 70;
    if (x > bounds.width - 70) newX = bounds.width - 70;
    if (y < 70) newY = 70;
    if (y > bounds.height - 70) newY = bounds.height - 70;

    newPositions.push({
      nft_id,
      x: newX - 60,
      y: newY - 60,
    });

    setNftsPositions(newPositions);

    if (nfts.find((n) => n.id == nft_id)) {
      return;
    } else {
      unstakeNft(nft_id);
    }
  };

  return (
    <div className=" w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex">
          <p className=" text-[22px] leading-none">Non Staked Bozos</p>
          <p className="ml-2 text-primary text-[22px] leading-none">
            ({nfts.length})
          </p>
        </div>
        <Button text="Stake All" onClick={stakeAllNfts} />
      </div>
      <div
        className="relative w-auto h-[250px] md:h-[84%] pb-2"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={boxRef}
      >
        <div
          className="relative h-full w-full "
          style={{
            backgroundImage: "url('/img/dashboard/loyalty/nftsbox.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        >
          {isGlobalDragging == "unstaking" && (
            <div className="absolute z-10 top-0 left-0  w-full h-full pointer-events-none overflow-hidden">
              <div className="w-full h-full bg-primary/60 rounded-[2rem] flex center text-center">
                <p className="text-[3rem] text-beige w-1/2">
                  Drop here to unstake
                </p>
              </div>
            </div>
          )}
        </div>

        {nfts.map((nft, index) => {
          return (
            <div
              key={index}
              className="md:w-[120px] md:h-[120px] w-[80px] h-[80px] absolute flex center "
              style={{
                top: nftsPositions.find((n) => n.nft_id == nft.id)?.y,
                left: nftsPositions.find((n) => n.nft_id == nft.id)?.x,
              }}
            >
              <Nft
                nft={nft}
                isStaked={false}
                isDraggable={isNftsDraggable.get(nft.id)!}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NftBox;
