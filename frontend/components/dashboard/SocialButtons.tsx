import React from "react";

const SocialButtons = () => {
  return (
    <div className=" w-fit flex center gap-2">
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

export default SocialButtons;
