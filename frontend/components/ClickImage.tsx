"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

const ClickImage = ({ children }: any) => {
  // When refreshing the page, it will scroll back to the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [imagePos, setImagePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const lastShownRef = useRef<number>(0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastShownRef.current < 500) {
        return;
      }

      lastShownRef.current = now;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      setImagePos({
        x: e.clientX + scrollLeft - 80,
        y: e.clientY + scrollTop - 40,
      });

      setTimeout(() => {
        setImagePos(null);
      }, 500);
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div>
      {imagePos && (
        <Image
          src="/img/bozo.png"
          alt="Bozo"
          width={150}
          height={100}
          className="absolute pointer-events-none z-[160]"
          style={{
            top: `${imagePos.y}px`,
            left: `${imagePos.x}px`,
            animation: "fadeInOut 0.5s forwards",
          }}
        />
      )}
      {children}
    </div>
  );
};

export default ClickImage;
