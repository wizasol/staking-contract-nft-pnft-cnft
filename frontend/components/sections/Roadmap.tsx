import Image from "next/image";
import React from "react";

const Roadmap = () => {
  return (
    <div className="my-20 container mx-auto">
      <h2 className="text-[60px] pt-20 lg:pt-48 lg:text-[90px] text-center mb-12 relative z-10">
        Roadmap
      </h2>
      <div className="rounded-[20px] aspect-[16/6.5] relative mx-auto max-w-[1000px]">
        <Image
          src="/img/roadmap/cornice.png"
          alt="Bozo"
          width={1000}
          height={600}
          className="w-full h-full object-contain absolute top-0 left-0"
        />
        <video
          src="/img/roadmap/testa-rotante.mp4"
          playsInline
          loop
          autoPlay
          muted
          disablePictureInPicture
          disableRemotePlayback
          className="rounded-[20px] w-full h-full object-cover"
        />
        <p className="lg:bottom-6 lg:right-6 bottom-2 right-2 leading-none absolute text-[18px] lg:text-[28px] pulse-anim">
          jk, we don&apos;t have a roadmap
        </p>
        <Image
          src="/img/roadmap/bozo-roadmap.png"
          alt="Bozo"
          width={300}
          height={300}
          className="right-[-0.5rem] md:right-[-2rem] absolute bottom-full w-[100px] md:w-[200px] lg:w-[300px]"
        />
      </div>
    </div>
  );
};

export default Roadmap;
