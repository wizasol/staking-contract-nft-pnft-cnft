"use client";
import React, { useState, useEffect } from "react";

const Preloader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (document) {
        const body = document.body;
        const homeWrapper = document.querySelector(".home-content");
        if (homeWrapper) {
          (homeWrapper as HTMLElement).style.opacity = "1";
          body.style.overflow = "auto";
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`${
        isVisible ? "opacity-100" : "opacity-0"
      } fixed z-[95] top-0 left-0 w-screen h-screen bg-beige transition-all duration-500 pointer-events-none`}>
      <div />
      <video
        src="/video/preloader_desktop.mp4"
        playsInline
        loop
        autoPlay
        muted
        disablePictureInPicture
        disableRemotePlayback
        className="w-full h-full object-cover absolute z-[100]"
      />
    </div>
  );
};

export default Preloader;
