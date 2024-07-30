import React from "react";
import Image from "next/image";

type HeaderProps = {
  title: string;
};

const Header = ({ title }: HeaderProps) => {
  return (
    <div className="mx-auto text-center w-fit">
      <Image
        src="/img/hero/logo-bozo.png"
        width={336.96}
        height={50.4}
        alt="Bozo"
        className="w-[337px] relative top-[-13px] mx-auto anim-perspective"
      />
      <p className="text-primary text-[30px] mt-[-13px]">{title}</p>
    </div>
  );
};

export default Header;
