"use client";

import React, { useEffect, useRef } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Button from "./Button";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const WalletButton = () => {
  const { setVisible } = useWalletModal();
  const wallet = useWallet();
  const params = useSearchParams();

  const router = useRouter();

  const { status } = useSession();

  const shoud = useRef(false);

  const connect = () => {
    shoud.current = true;
    setVisible(true);
  };

  const disconnect = () => {
    router.push("/dashboard");
    wallet.disconnect().then(() => {
      signOut();
    });
  };

  const clampPublicKey = (publicKey: string) => {
    if (!publicKey) return "";
    //return only the first 4 characters than ... and the last 3 characters
    return publicKey.slice(0, 4) + "..." + publicKey.slice(-3);
  };

  useEffect(() => {
    if (params.get("expired") === "true") {
      wallet.disconnect();
      signOut({
        callbackUrl: "/dashboard",
      });
    }
  }, [params]);

  useEffect(() => {
    //if (!wallet.connected || !wallet.signMessage) return;
    if (status === "unauthenticated" && shoud.current) {
      shoud.current = false;
      fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/user/getNonce`, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            const nonce = `Welcome to Bozo Collective!\n\n${res.nonce}`;
            const message = new TextEncoder().encode(nonce);
            wallet.signMessage!(message)
              .then((signature) => {
                signIn("credentials", {
                  wallet: wallet.publicKey?.toString()!,
                  signature: JSON.stringify(signature),
                  nonce: nonce,
                  redirect: false,
                });
              })
              .catch((error) => {
                wallet.disconnect();
              });
          } else {
            toast.error("Error authenticating user");
            wallet.disconnect();
          }
        });
    }
    setButtonText(clampPublicKey(wallet.publicKey?.toString()!));
  }, [wallet.connected]);

  const [buttonText, setButtonText] = React.useState(
    clampPublicKey(wallet.publicKey?.toString()!)
  );

  return (
    <>
      {!wallet.connected ? (
        <>
          <Button
            variant="secondary"
            onClick={connect}
            text={
              wallet.connecting
                ? "Connecting..."
                : wallet.connected
                ? clampPublicKey(wallet.publicKey?.toString()!)
                : "Connect Wallet"
            }
            class="max-w-[300px]"
          />
          <svg
            width="95"
            height="131"
            viewBox="0 0 95 131"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-[100%] right-[110%] animate-arrow-wallet "
          >
            <mask id="path-1-inside-1_234_240" fill="white">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M29.9313 57.0441C26.8016 55.337 23.1838 54.8237 19.1225 56.012C6.55909 59.6884 1.47678 69.5265 0.790594 81.1889C-0.210793 98.2181 8.30238 119.175 15.9118 129.59C16.2716 130.084 16.9635 130.19 17.4544 129.83C17.9481 129.47 18.0568 128.779 17.697 128.285C10.3107 118.176 2.02633 97.8444 2.99704 81.3173C3.62744 70.6089 8.20482 61.5099 19.7445 58.1347C23.1782 57.1278 26.2298 57.5712 28.8797 59.0078C27.9676 60.7539 27.1168 62.5029 26.3302 64.2518C24.16 69.0802 20.916 82.486 22.1266 92.3437C22.9969 99.4147 26.1517 104.656 33.047 104.472C36.8796 104.369 39.6522 101.981 41.3481 98.1819C43.6829 92.9602 43.945 84.9602 42.3021 77.295C40.9353 70.9129 38.2576 64.7735 34.4585 60.6535C33.6216 59.7498 32.7345 58.938 31.7945 58.2407C44.9046 34.2632 69.2587 11.8422 94.2683 2.38616C94.8373 2.16859 95.1274 1.53265 94.9098 0.960825C94.695 0.389002 94.0562 0.101679 93.4872 0.316462C68.0704 9.92866 43.312 32.6761 29.9313 57.0441ZM30.7373 60.224C29.8838 61.8669 29.0861 63.5126 28.3469 65.1584C26.2688 69.7859 23.1614 82.6283 24.3218 92.0731C25.0331 97.8694 27.3372 102.413 32.9885 102.263C35.9564 102.182 38.0148 100.221 39.3314 97.2809C40.7763 94.0452 41.3287 89.6631 41.0971 84.9909C40.7457 77.8975 38.5784 70.1375 34.8071 64.6452C33.6133 62.9046 32.2548 61.3955 30.7373 60.224Z"
              />
            </mask>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M29.9313 57.0441C26.8016 55.337 23.1838 54.8237 19.1225 56.012C6.55909 59.6884 1.47678 69.5265 0.790594 81.1889C-0.210793 98.2181 8.30238 119.175 15.9118 129.59C16.2716 130.084 16.9635 130.19 17.4544 129.83C17.9481 129.47 18.0568 128.779 17.697 128.285C10.3107 118.176 2.02633 97.8444 2.99704 81.3173C3.62744 70.6089 8.20482 61.5099 19.7445 58.1347C23.1782 57.1278 26.2298 57.5712 28.8797 59.0078C27.9676 60.7539 27.1168 62.5029 26.3302 64.2518C24.16 69.0802 20.916 82.486 22.1266 92.3437C22.9969 99.4147 26.1517 104.656 33.047 104.472C36.8796 104.369 39.6522 101.981 41.3481 98.1819C43.6829 92.9602 43.945 84.9602 42.3021 77.295C40.9353 70.9129 38.2576 64.7735 34.4585 60.6535C33.6216 59.7498 32.7345 58.938 31.7945 58.2407C44.9046 34.2632 69.2587 11.8422 94.2683 2.38616C94.8373 2.16859 95.1274 1.53265 94.9098 0.960825C94.695 0.389002 94.0562 0.101679 93.4872 0.316462C68.0704 9.92866 43.312 32.6761 29.9313 57.0441ZM30.7373 60.224C29.8838 61.8669 29.0861 63.5126 28.3469 65.1584C26.2688 69.7859 23.1614 82.6283 24.3218 92.0731C25.0331 97.8694 27.3372 102.413 32.9885 102.263C35.9564 102.182 38.0148 100.221 39.3314 97.2809C40.7763 94.0452 41.3287 89.6631 41.0971 84.9909C40.7457 77.8975 38.5784 70.1375 34.8071 64.6452C33.6133 62.9046 32.2548 61.3955 30.7373 60.224Z"
              stroke="#1E1E1E"
              strokeWidth="4"
              mask="url(#path-1-inside-1_234_240)"
            />
            <mask id="path-2-inside-2_234_240" fill="white">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M74.5064 38.5695C76.7323 25.571 85.2287 11.7301 94.3863 2.14575C94.8075 1.70503 94.7908 1.00487 94.35 0.583674C93.9093 0.162478 93.2092 0.176458 92.788 0.61718C83.3431 10.5 74.6235 24.7955 72.3278 38.1957C72.2246 38.7954 72.6292 39.3673 73.2317 39.4705C73.8314 39.5737 74.4032 39.1692 74.5064 38.5695Z"
              />
            </mask>
            <path
              id="svgarrow1"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M74.5064 38.5695C76.7323 25.571 85.2287 11.7301 94.3863 2.14575C94.8075 1.70503 94.7908 1.00487 94.35 0.583674C93.9093 0.162478 93.2092 0.176458 92.788 0.61718C83.3431 10.5 74.6235 24.7955 72.3278 38.1957C72.2246 38.7954 72.6292 39.3673 73.2317 39.4705C73.8314 39.5737 74.4032 39.1692 74.5064 38.5695Z"
              stroke="#1E1E1E"
              strokeWidth="4"
              mask="url(#path-2-inside-2_234_240)"
            />
            <mask id="path-3-inside-3_234_240" fill="white">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M92.6455 0.383957C83.1114 5.82883 68.4867 6.58198 57.8257 3.82328C57.2343 3.66987 56.629 4.02414 56.4784 4.61549C56.325 5.20684 56.6792 5.8093 57.2705 5.96272C68.4392 8.85251 83.7529 8.00737 93.7417 2.30309C94.2717 2.00183 94.4559 1.32397 94.1546 0.793988C93.8506 0.264006 93.1755 0.0799147 92.6455 0.383957Z"
              />
            </mask>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M92.6455 0.383957C83.1114 5.82883 68.4867 6.58198 57.8257 3.82328C57.2343 3.66987 56.629 4.02414 56.4784 4.61549C56.325 5.20684 56.6792 5.8093 57.2705 5.96272C68.4392 8.85251 83.7529 8.00737 93.7417 2.30309C94.2717 2.00183 94.4559 1.32397 94.1546 0.793988C93.8506 0.264006 93.1755 0.0799147 92.6455 0.383957Z"
              stroke="#1E1E1E"
              strokeWidth="4"
              mask="url(#path-3-inside-3_234_240)"
            />
          </svg>
        </>
      ) : (
        <>
          <div
            onMouseOver={() => setButtonText("Disconnect?")}
            onMouseOut={() =>
              setButtonText(clampPublicKey(wallet.publicKey?.toString()!))
            }
            className="hidden md:block"
          >
            <Button
              variant="secondary"
              onClick={disconnect}
              text={buttonText}
              class="max-w-[300px] min-w-[141px]"
            />
          </div>
          <div className="md:hidden">
            <Button
              variant="secondary"
              onClick={disconnect}
              text={buttonText}
              class="max-w-[300px] min-w-[141px]"
            />
          </div>
        </>
      )}
    </>
  );
};

export default WalletButton;
