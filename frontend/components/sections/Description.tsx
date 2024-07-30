"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { gsap } from "gsap";

const Description = () => {
  const [h3InView, setH3InView] = useState(false);
  const [leftBlockInView, setLeftBlockInView] = useState(false);
  const [rightBlockInView, setRightBlockInView] = useState(false);

  const { ref: h3Ref, inView: h3IsInView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });

  const { ref: leftBlockRef, inView: leftBlockIsInView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });

  const { ref: rightBlockRef, inView: rightBlockIsInView } = useInView({
    threshold: 0.6,
    triggerOnce: false,
  });

  if (h3IsInView && !h3InView) {
    setH3InView(true);
  } else if (!h3IsInView && h3InView) {
    setH3InView(false);
  }

  if (leftBlockIsInView && !leftBlockInView) {
    setLeftBlockInView(true);
  } /* else if (!leftBlockIsInView && leftBlockInView) {
    setLeftBlockInView(false);
  }
 */
  if (rightBlockIsInView && !rightBlockInView) {
    setRightBlockInView(true);
  } /* else if (!rightBlockIsInView && rightBlockInView) {
    setRightBlockInView(false);
  } */

  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollY = window.scrollY;
        gsap.to(parallaxRef.current, {
          y: scrollY * 0.08,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="mt-20">
      <div className="container mx-auto mb-12">
        <h3
          ref={h3Ref}
          className={`text-[30px] lg:text-[35px] text-center max-w-[980px] mx-auto 
          ${
            h3InView ? "animate-fadeUp" : "opacity-0 transform translate-y-4"
          }`}>
          Bozo Collective is a free Solana project with art inspired by diary of
          a wimpy kid. Holding one of these gloriously ugly mfers will grant you
          access to the Bozo DAO. Other than that we don&apos;t know what the
          F*ck to tell you.
        </h3>
      </div>
      <div className="relative overflow-hidden">
        <div
          ref={leftBlockRef}
          className={`absolute top-20 left-[10%] hidden lg:block 
        ${
          leftBlockInView
            ? "animate-scaleRotate"
            : "opacity-0 transform scale-0.9 rotate-30"
        }`}>
          <p className="text-[90px] leading-none rotate-[-15degx] absolute top-0 left-0">
            F*ck
          </p>
          <p className="text-[90px] leading-none rotate-[15deg] absolute top-24 left-20">
            F*ck
          </p>
          <p className="text-[90px] leading-none rotate-[13deg] absolute top-40 left-[-2rem]">
            F*ck
          </p>
        </div>
        <div className={`absolute right-[10%] w-full`}>
          <p
            ref={rightBlockRef}
            className={`${
              rightBlockInView
                ? "animate-scaleRotate"
                : "opacity-0 transform scale-0.9 rotate-30"
            } absolute right-0 hidden lg:block text-[80px] leading-none rotate-[15deg] top-20 text-right`}>
            Support Us
            <br />
            or GTFO
          </p>
        </div>
        <div
          ref={parallaxRef}
          className="aspect-square max-w-[600px] mx-auto overflow-hidden">
          <Image
            src="/img/description/desc.png"
            alt="Bozo"
            width={1500}
            height={1500}
            className=""
          />
        </div>
      </div>
    </div>
  );
};

export default Description;
