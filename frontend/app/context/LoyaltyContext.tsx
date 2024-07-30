"use client";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface LoyaltyContextType {
  isGlobalDragging: "staking" | "unstaking" | false;
  setIsGlobalDragging: (isDragging: "staking" | "unstaking" | false) => void;
  isGlobalLoading: boolean;
  setIsGlobalLoading: (isGlobalLoading: boolean) => void;
}

const LoyaltyContext = createContext<LoyaltyContextType>({
  isGlobalDragging: false,
  setIsGlobalDragging: () => {},
  isGlobalLoading: false,
  setIsGlobalLoading: () => {},
});

export const LoyaltyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isGlobalDragging, setIsGlobalDragging] = useState<
    "staking" | "unstaking" | false
  >(false);

  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  return (
    <LoyaltyContext.Provider
      value={{
        isGlobalDragging,
        setIsGlobalDragging,
        isGlobalLoading,
        setIsGlobalLoading,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => useContext(LoyaltyContext);
