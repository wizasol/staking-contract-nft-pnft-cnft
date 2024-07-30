"use client";

import { useRouter } from "next/navigation";
import { type } from "os";
import React from "react";

export type ButtonProps = {
  text: string;
  onClick?: (e?: any) => void;
  type?: "button" | "submit" | "reset" | undefined;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  redirect?: string;
  class?: string;
};

const Button = ({
  text,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  redirect = "#",
  class: passedclass = "",
}: ButtonProps) => {
  const router = useRouter();
  return (
    <button
      type={type}
      disabled={disabled}
      className={` ${
        variant == "primary"
          ? `text-beige ${
              !disabled && " md:hover:bg-black md:hover:text-primary"
            }  bg-primary`
          : `text-beige ${!disabled && " md:hover:text-primary"}  bg-black`
      }   flex center select-none  w-fit text-[22px] leading-none shrink-0 rounded-lg px-6 pt-3 pb-2  duration-300 transition-colors ${passedclass}`}
      onClick={(e) => {
        /* e.preventDefault(); */
        e.stopPropagation();
        if (onClick) onClick();
        if (redirect != "#") router.push(redirect);
      }}
    >
      {text}
    </button>
  );
};

export default Button;
