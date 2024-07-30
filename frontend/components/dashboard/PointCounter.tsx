import React from "react";
import Image from "next/image";

type PointCounterProps = {
  points: number;
};

const PointCounter = ({ points }: PointCounterProps) => {
  return (
    <div
      className={`relative h-[42px] flex center select-none border w-fit text-[22px] leading-none shrink-0 rounded-lg px-6 pt-3 pb-2 transition-colors text-primary border-black`}
    >
      <div className="absolute h-full w-auto aspect-square top-[2px] left-0 p-1">
        <div className="relative h-full w-full">
          <Image
            src="/img/dashboard/counter.png"
            alt="Counter"
            className=" "
            fill
            sizes="100% 100%"
          />
        </div>
      </div>
      <p className="ml-5">{Math.trunc(points * 100) / 100}</p>
    </div>
  );
};

export default PointCounter;
