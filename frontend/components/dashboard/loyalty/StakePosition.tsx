import React, { useContext, useState } from "react";
import Image from "next/image";
import Nft from "./Nft";
import { NftType } from "@/app/dashboard/loyalty/page";
import { StakePositionType } from "./Stake";
import { useLoyalty } from "@/app/context/LoyaltyContext";

export type StakePositionProps = {
  index: number;
  stakeNft: (nft_id: string) => void;
  isNftsDraggable: Map<string, boolean>;
} & StakePositionType;

const StakePosition = (props: StakePositionProps) => {
  const { isGlobalDragging, setIsGlobalDragging } = useLoyalty();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    const nft_id = e.dataTransfer.getData("nft");
    props.stakeNft(nft_id);
  };
  return (
    <div className="pl-7 pr-4 flex-none pt-4 aspect-[4/5] relative overflow-hidden pb-10">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{ animationDelay: `${props.index * 0.1}s` } as any}
        /* w-[150px] h-[150px] md:w-[190px] md:h-[190px] */
        className={` h-[80%]  aspect-square flex-none mx-auto `}
      >
        <div className="w-full h-full opacity-0 bg-[url('/img/dashboard/loyalty/nftnotstaked.png')]  animate-fadein bg-cover relative overflow-visible flex justify-center items-center rounded-[0.8rem]  text-center">
          <div className="absolute top-[-1rem] right-3 z-20">
            <p className="text-[30px] text-primary ">{props.index + 1}</p>
          </div>
          {props.type == "empty" ? (
            <>
              {" "}
              <Image
                src={
                  props.active
                    ? "/img/dashboard/loyalty/activestakingslot.svg"
                    : "/img/dashboard/loyalty/stakingslot.svg"
                }
                alt="activestakingslot"
                fill
                draggable={false}
              />
              {props.active && (
                <div
                  className={`w-full h-full flex center text-center rounded-xl transition-colors duration-200 ${
                    isGlobalDragging == "staking" ? "bg-primary/60" : ""
                  }`}
                >
                  <p
                    className={`md:text-[24px] text-[18px] px-5 ${
                      isGlobalDragging == "staking"
                        ? "text-beige"
                        : "text-primary"
                    } `}
                  >
                    Drag here your Bozo
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Nft
                nft={props.nft}
                isStaked={true}
                isDraggable={props.isNftsDraggable.get(props.nft.id)!}
              />
              <Image
                src="/img/dashboard/loyalty/stakingslot.svg"
                alt="activestakingslot"
                fill
                draggable={false}
              />
            </>
          )}
        </div>
        <div className="w-full flex flex-col md:py-4 items-center">
          <div className="flex justify-center items-center">
            <div
              className={`w-5 h-5 z-10 ${
                props.type == "filled"
                  ? "bg-primary border-primarydark"
                  : "bg-grey border-black"
              }  rounded-full  border-2`}
            ></div>
            <div className="flex">
              <div
                className={`h-[0.1rem] ${
                  props.type == "filled" ? "bg-primary" : "bg-black"
                }  w-full absolute left-0`}
                style={{ width: "calc(50%)" }}
              ></div>
              <div
                className={`h-[0.1rem] ${
                  props.type == "filled" && props.nextfilled
                    ? "bg-primary"
                    : "bg-black"
                } w-full absolute left-1/2`}
                style={{ width: "calc(50% + 1.75rem )" }}
              ></div>
            </div>
          </div>
          <p
            className={` ${
              props.type == "filled" ? "text-primary" : "text-grey"
            } text-[33px] relative w-[75px] h-[57px] flex justify-center items-center`}
          >
            {props.index === 0 && "x1"}
            {(1 + props.index) % 5 == 0 &&
              `x${((1 + props.index) / 5 - 1) * 0.5 + 2}`}
            {((1 + props.index) % 5 == 0 || props.index === 0) && (
              <svg
                width="75"
                height="57"
                viewBox="0 0 75 57"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-[-5px] left-[8px]"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M23.5926 49.3714C22.9984 51.4886 22.6987 53.7052 22.4242 55.8554C22.3666 56.3185 22.6878 56.7485 23.1403 56.7816C23.5932 56.8478 24.0074 56.5168 24.0649 56.0867C24.3293 54.0026 24.6121 51.8526 25.1841 49.8347C25.3081 49.4046 25.0527 48.9413 24.6134 48.809C24.1744 48.6767 23.7169 48.9414 23.5926 49.3714Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1703 42.9542C11.6932 46.3615 8.66372 50.1989 5.09333 53.54C4.75988 53.8377 4.74202 54.367 5.05331 54.6978C5.36492 55.0286 5.88892 55.0616 6.22237 54.7308C9.80301 51.3896 12.8425 47.5523 16.3298 44.145C16.6553 43.8142 16.6599 43.285 16.3397 42.9542C16.0198 42.6565 15.4958 42.6234 15.1703 42.9542Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.79575 36.569C3.78588 36.4698 5.776 36.3708 7.76646 36.2715C8.22231 36.2715 8.57429 35.8744 8.55212 35.4112C8.52963 34.9481 8.1416 34.6175 7.68541 34.6175C5.69198 34.7167 3.69888 34.8158 1.70577 34.915C1.24992 34.9481 0.90026 35.3451 0.925071 35.8083C0.949881 36.2383 1.34023 36.6021 1.79575 36.569Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M48.2795 8.21375C50.0651 6.46975 51.6177 4.4609 53.108 2.50301C53.4274 2.08041 53.3557 1.47543 52.9296 1.18607C52.522 0.864009 51.927 0.954328 51.6264 1.3444C50.1837 3.24308 48.6854 5.19608 46.9779 6.85511C46.6119 7.20745 46.6 7.80784 46.9568 8.18725C47.3132 8.56646 47.9132 8.5659 48.2795 8.21375Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M52.9173 19.3025C58.2691 17.9265 63.425 15.8737 68.831 14.6156C69.3278 14.5122 69.6458 14.002 69.5275 13.5002C69.4089 12.9981 68.9125 12.6684 68.397 12.8043C62.9809 14.0565 57.8152 16.1037 52.4533 17.4739C51.9456 17.6143 51.6407 18.1319 51.7677 18.6388C51.9132 19.113 52.4095 19.4429 52.9173 19.3025Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M62.4404 33.1698C60.4274 32.1377 58.4146 31.1054 56.4013 30.0731C55.9531 29.8144 55.3816 30.0051 55.1405 30.473C54.8997 30.9411 55.0936 31.4864 55.5421 31.7453C57.5583 32.7793 59.5741 33.8133 61.59 34.8471C62.0569 35.0733 62.6261 34.8814 62.8646 34.412C63.0843 33.9751 62.907 33.3958 62.4404 33.1698Z"
                  fill={props.type == "filled" ? "#C8453B" : "#726F68"}
                />
              </svg>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StakePosition;
