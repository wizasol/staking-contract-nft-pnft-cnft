import React from "react";
import Button from "../dashboard/Button";

const Header = () => {
  return (
    <div className="container mx-auto py-7 flex center gap-2 md:relative">
      <div className="absolute mx-auto top-1/4 md:right-0 md:top-7">
        <a href="/dashboard">
          <Button text="Open App" />
        </a>
      </div>

      <a
        href="https://discord.com/invite/bozocollective"
        target="_blank"
        className="rounded-2xl bg-primary hover:bg-black hover:text-primary transition-colors text-white aspect-square shrink-0 w-[50px] flex center"
      >
        <i className="text-3xl bi bi-discord leading-[0]"></i>
      </a>
      <a
        href="https://twitter.com/BozoCollective"
        target="_blank"
        className="rounded-2xl bg-primary hover:bg-black hover:text-primary transition-colors text-white aspect-square shrink-0 w-[50px] flex center"
      >
        <i className="text-2xl bi bi-twitter-x leading-[0]"></i>
      </a>
    </div>
  );
};

export default Header;
