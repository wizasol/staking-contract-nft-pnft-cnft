"use client";

import { ReactLenis } from "@studio-freight/react-lenis";
import React from "react";

const ReactLenisComponent = ({ children }: any) => {
  return <ReactLenis root>{children}</ReactLenis>;
};

export default ReactLenisComponent;
