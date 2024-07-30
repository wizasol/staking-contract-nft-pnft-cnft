import Image from "next/image";
import React from "react";

const MarqueeCard = ({ img, name }: { img: string; name: string }) => {
  return (
    <div className="w-[150px] md:w-[200px] aspect-square overflow-hidden relative group cursor-default">
      <Image
        src={img}
        alt={name}
        width={200}
        height={200}
        className=""
      />
      <div className="bg-black/50 text-white text-center w-full h-full flex center absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[22px] md:text-[32px]">
        {name}
      </div>
    </div>
  );
};

export default MarqueeCard;
