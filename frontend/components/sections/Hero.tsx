import React from "react";
import Header from "../navigation/Header";
import Image from "next/image";

const Hero = () => {
  return (
    <div className="min-h-screen relative">
      <Header />
      <Image
        src="/img/hero/logo-bozo.png"
        width={2000}
        height={500}
        alt="Bozo"
        className="anim-perspective mt-[180px] hero-logo sm:mt-[80px] md:mt-[150px] lg:mt-[100px] xl:mt-[50px] 2xl:mt-[0px] max-w-[95%] md:max-w-[85%] lg:max-w-[70%] mx-auto pointer-events-none relative z-50"
      />
      <div className="absolute bottom-0 w-full h-screen overflow-hidden pointer-events-none hero-img-container">
        <Image
          src="/img/hero/left-hero.png"
          width={1000}
          height={1000}
          alt="Bozo"
          className="absolute left-0 bottom-0 md:w-[60%] lg:w-2/5 z-[3] hidden md:block md:scale-100 2xl:bottom-[-2rem] hero-img-1"
        />
        <Image
          src="/img/hero/center-hero.png"
          width={1000}
          height={1000}
          alt="Bozo"
          className="absolute lg:left-0 md:right-[-2rem] lg:right-0 bottom-0 lg:mx-auto w-full lg:w-[45%] md:w-[60%] z-[2] scale-150 md:scale-100 origin-bottom 2xl:bottom-[-2rem] hero-img-2"
        />
        <Image
          src="/img/hero/right-hero.png"
          width={1000}
          height={1000}
          alt="Bozo"
          className="absolute right-0 bottom-0 w-2/5 z-[1] hidden lg:block 2xl:bottom-[-2rem] hero-img-3"
        />
        <div className="min-h-[600px] absolute bottom-0 left-0 right-0 flex items-end">
          <Image
            src="/img/hero/particles-hero.png"
            width={2560}
            height={1440}
            alt="Bozo"
            className="opacity-anim left-0 right-0 bottom-0 w-full z-0 h-full object-cover 2xl:translate-y-8 translate-y-[-150px] sm:translate-y-[-200px] md:translate-y-[-100px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
