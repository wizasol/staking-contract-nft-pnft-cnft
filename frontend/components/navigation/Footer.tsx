"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useInView } from "react-intersection-observer";

const Footer = () => {
  const [h3InView, setH3InView] = useState(false);
  const [leftBlockInView, setLeftBlockInView] = useState(false);
  const [rightBlockInView, setRightBlockInView] = useState(false);

  const { ref: containerRef, inView: h3IsInView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });

  const { ref: imgRef, inView: leftBlockIsInView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const { ref: textRef, inView: rightBlockIsInView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  if (h3IsInView && !h3InView) {
    setH3InView(true);
  } else if (!h3IsInView && h3InView) {
    setH3InView(false);
  }

  if (leftBlockIsInView && !leftBlockInView) {
    setLeftBlockInView(true);
  } else if (!leftBlockIsInView && leftBlockInView) {
    setLeftBlockInView(false);
  }

  if (rightBlockIsInView && !rightBlockInView) {
    setRightBlockInView(true);
  } else if (!rightBlockIsInView && rightBlockInView) {
    setRightBlockInView(false);
  }
  return (
    <div className="container mb-8 mx-auto">
      <div
        ref={containerRef}
        className={` ${
          h3InView
            ? "opacity-100 translate-y-0"
            : "opacity-0 transform translate-y-20"
        } bg-black text-primary overflow-hidden rounded-[40px] relative px-12 py-6 transition-all duration-700`}>
        <Image
          src="/img/footer/footer.png"
          alt="Bozo"
          width={300}
          height={300}
          className={` ${
            leftBlockInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 transform translate-y-[70%]"
          } absolute left-0 bottom-0 hidden lg:block transition-all duration-300`}
          ref={imgRef}
        />
        <div className="absolute top-20 left-[20%] hidden lg:block text-[50px]">
          <p className="leading-none rotate-[-15deg] absolute top-0 left-0">
            F*ck
          </p>
          <p className="leading-none rotate-[-20deg] absolute top-12 left-16">
            F*ck
          </p>
          <p className="leading-none rotate-[13deg] absolute top-16 left-[-2rem]">
            F*ck
          </p>
        </div>
        <div className="flex center pb-8 pt-8 md:pt-24 lg:pt-36">
          <Image
            src="/img/hero/logo-bozo.png"
            alt="Bozo"
            width={500}
            height={200}
            className=""
          />
        </div>
        <div className="flex center gap-2">
          <a
            href="https://discord.com/invite/bozodao"
            target="_blank"
            className="rounded-2xl bg-primary hover:bg-black hover:text-primary transition-colors text-white aspect-square shrink-0 w-[50px] flex center">
            <i className="text-3xl bi bi-discord leading-[0]"></i>
          </a>
          <a
            href="https://twitter.com/BozoCollective"
            target="_blank"
            className="rounded-2xl bg-primary hover:bg-black hover:text-primary transition-colors text-white aspect-square shrink-0 w-[50px] flex center">
            <i className="text-2xl bi bi-twitter-x leading-[0]"></i>
          </a>
        </div>
        <div
          ref={textRef}
          className={`${
            leftBlockInView
              ? "opacity-100 translate-y-0"
              : "lg:opacity-0 transform lg:translate-y-full"
          } mt-6 text-[18px] lg:text-right text-center transition-all duration-300`}>
          <a
            href="https://www.syndra.io/"
            target="_blank">
            Made with love by <span className="text-white">Syndra</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
