"use client";

import React, { useState } from "react";
import { useInView } from "react-intersection-observer";
import Marquee from "react-fast-marquee";
import MarqueeCard from "../cards/MarqueeCard";
import images from "@/utils/marquee";

const MarqueeSection = () => {
  const [h3InView, setH3InView] = useState(false);

  const { ref: titleRef, inView: h3IsInView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  if (h3IsInView && !h3InView) {
    setH3InView(true);
  } else if (!h3IsInView && h3InView) {
    setH3InView(false);
  }

  function rotateArray(arr: any, count: number) {
    const len = arr.length;
    const start = count % len;
    return [...arr.slice(start), ...arr.slice(0, start)];
  }

  return (
    <div className="my-20">
      <div className="container mx-auto">
        <h2
          ref={titleRef}
          className={`${
            h3InView ? "animate-rotate-perspective" : "opacity-0"
          } text-center text-[60px] lg:text-[90px]`}>
          Our degen friends
        </h2>
      </div>
      {[0, 9, 18, 27].map((shift, idx) => (
        <Marquee
          key={idx}
          autoFill
          direction={idx % 2 === 0 ? "left" : "right"}
          speed={20}>
          {rotateArray(images, shift).map((image, index) => (
            <MarqueeCard
              key={index}
              img={`/img/marquee/${image}`}
              name={image.replace(".png", "")}
            />
          ))}
        </Marquee>
      ))}
    </div>
  );
};

export default MarqueeSection;
