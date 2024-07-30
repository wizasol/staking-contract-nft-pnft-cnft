"use client";

import React, { useContext, useRef, useState } from "react";
import Image from "next/image";
import Button from "../Button";
import { NftType } from "@/app/dashboard/loyalty/page";
import { useLoyalty } from "@/app/context/LoyaltyContext";

const Nft = ({
  nft,
  isStaked,
  isDraggable,
}: {
  nft: NftType;
  isStaked: boolean;
  isDraggable: boolean;
}) => {
  const { setIsGlobalDragging, isGlobalDragging } = useLoyalty();

  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(true);

  const [mouseDown, setMouseDown] = useState(false);
  return (
    <div
      className={`${
        isDraggable
          ? mouseDown
            ? "animate-nft-mouse-down"
            : "animate-nft-mouse-up"
          : "animate-pulse"
      } w-full h-full  rounded-[0.8rem] flex center cursor-grab  z-10 ${
        isGlobalDragging && !isDragging ? "pointer-events-none" : ""
      }  ${isDragging ? "!opacity-[0.001] cursor-grabbing " : ""} ${
        !isDraggable ? "animate-pulse" : ""
      }`}
      /* ${mouseDown ? "!w-[100px] !h-[100px]" : ""} */
      draggable={isDraggable}
      onMouseDown={(e) => {
        e.stopPropagation();
        setMouseDown(true);
      }}
      onMouseUp={(e) => {
        setMouseDown(false);
      }}
      onDragStart={(e) => {
        const element = e.target as HTMLDivElement;
        const { width, height } = element.getBoundingClientRect();

        // Calcola le coordinate del centro rispetto all'elemento
        const offsetX = width / 2;
        const offsetY = height / 2;

        // Imposta i dati da trascinare
        e.dataTransfer.setDragImage(element, offsetX, offsetY);
        setIsDragging(true);
        if (isStaked) {
          setIsGlobalDragging("unstaking");
        } else {
          setIsGlobalDragging("staking");
        }

        e.dataTransfer.setData("nft", nft.id.toString());
      }}
      onDragEnd={(e) => {
        setIsGlobalDragging(false);
        setIsDragging(false);
        setMouseDown(false);
      }}
    >
      <div
        className={` w-full h-full relative border-[2.75px] bg-beige border-black rounded-[0.8rem]  transition-all duration-1000 overflow-hidden`}
      >
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex center z-10  ">
            <div className="relative w-[70%] h-[70%] ">
              <Image
                src="/img/dashboard/counter.png"
                alt="Counter"
                className="animate-spin"
                fill
                sizes="100% 100%"
              />
            </div>
          </div>
        )}
        <Image
          src={nft.image}
          alt="nft"
          className={``}
          fill
          sizes="100% 100% "
          draggable={false}
          onLoadingComplete={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default Nft;
