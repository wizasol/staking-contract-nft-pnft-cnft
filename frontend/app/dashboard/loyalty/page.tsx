"use client";

import { LoyaltyProvider, useLoyalty } from "@/app/context/LoyaltyContext";
import Button from "@/components/dashboard/Button";
import Header from "@/components/dashboard/Header";
import WalletComponents from "@/components/dashboard/WalletComponents";
import NftBox from "@/components/dashboard/loyalty/NftBox";
import Stake from "@/components/dashboard/loyalty/Stake";
import { stakeNfts, unstakeNfts } from "@/utils/pnftStaking/lib";
import {
  GenericRequest,
  GenericRequestNoAuth,
  genericRequest,
} from "@/utils/request";
import { getTx, stake, unstake } from "@/utils/staking/lib";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  MutableRefObject,
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export type NftType = {
  id: string;
  image: string;
};

const parseNft = (nft: any) => {
  return {
    id: nft.mint,
    image: nft.image.split("?")[0],
  } as NftType;
};

function calcolaPunteggio(numero: number) {
  let punteggio = 0;
  for (let i = 1; i <= numero; i++) {
    if (i % 5 === 0) {
      console.log(2 + (i / 5 - 1) * 0.5);
      punteggio += 24 * (2 + (i / 5 - 1) * 0.5);
    } else {
      punteggio += 24;
    }
  }
  return punteggio;
}

function arrayDifference(vecchio: any, nuovo: any) {
  if (vecchio.length !== nuovo.length) return true;
  // Estrai gli id dai vecchi e nuovi oggetti in due array separati
  const vecchioIds = vecchio.map((obj: any) => obj.id);
  const nuovoIds = nuovo.map((obj: any) => obj.id);

  // Confronta gli array di id
  const differenze: any = [];
  nuovoIds.forEach((id: any) => {
    if (!vecchioIds.includes(id)) {
      differenze.push(id);
    }
  });

  // Verifica se ci sono differenze e restituisci il risultato
  if (differenze.length > 0) {
    return true;
  } else {
    return false;
  }
}

export default function Loyalty() {
  const [stakedNfts, setStakedNfts] = useState<NftType[]>([]);
  const [nfts, setNfts] = useState<NftType[]>([]);
  const timerRef = useRef<any>(null);

  const [nftsTimers, setNftsTimers] = useState<MutableRefObject<any>[]>([]);

  const [shouldFetch, setShouldFetch] = useState(true);

  const [totalPoints, setTotalPoints] = useState(0);
  const [toClaimPoints, setToClaimPoints] = useState(0);

  const { data: session, update: updateSession } = useSession();

  const wallet = useWallet();

  const [isNftsDraggable, setIsNftsDraggable] = useState<Map<string, boolean>>(
    new Map()
  );

  useEffect(() => {}, [isNftsDraggable]);

  const setNftDraggable = (nft_ids: Array<string>, isDraggable: boolean) => {
    const tmpIsNftsDraggable = isNftsDraggable;
    nft_ids.forEach((nft_id) => {
      tmpIsNftsDraggable.set(nft_id, isDraggable);
    });
    setIsNftsDraggable(new Map(tmpIsNftsDraggable));
  };

  const setNtfsTimouted = (nfts: NftType[]) => {
    setNfts([]);
    const tmpNftsTimers: any = [];
    nfts.forEach((nft, index) => {
      const timer = setTimeout(() => {
        setNfts((nfts) => [...nfts, nft]);
      }, (Math.random() * (10 - 1) + 1) * index);
      tmpNftsTimers.push(timer);
    });
    setNftsTimers(tmpNftsTimers);
  };

  const { refetch: refetchNft } = useQuery(
    ["nfts"],
    async () => {
      if (!shouldFetch) return;

      const nftsRequest: GenericRequest = {
        method: "GET",
        url: "/nft/nftsByWallet",
        token: session?.user.token!,
      };
      const response = await genericRequest(nftsRequest);

      const tmpnfts: NftType[] = [];
      const tmpstakednfts: NftType[] = [];
      const mints: string[] = [];
      response.nfts.forEach((nft: any) => {
        mints.push(nft.mint);
        if (nft.staked) tmpstakednfts.push(parseNft(nft));
        else tmpnfts.push(parseNft(nft));
      });

      /* const prova = [];
      console.log(tmpnfts);
      for (let index = 0; index < 200; index++) {
        prova.push({
          id: index.toString(),
          image:
            "https://bafybeih5pne3wm5ugxlkd7fdgxgzfa4hnpdaui5htgy7y4mtk42dvdb5ue.ipfs.nftstorage.link/4470.png",
        });
      } */

      setNftDraggable(mints, true);

      if (arrayDifference(nfts, tmpnfts)) {
        /* setNtfsTimouted(prova); */
        setNfts(tmpnfts);
      }

      setStakedNfts(tmpstakednfts);
      //timeouted setNfts

      /*       setNfts(prova);
       */ return response;
    },
    {
      enabled: !!session?.user.token && shouldFetch,
      refetchOnWindowFocus: shouldFetch,
    }
  );

  useQuery(
    ["points"],
    async () => {
      const nftsRequest: GenericRequest = {
        method: "GET",
        url: "/nft/getPoints",
        token: session?.user.token!,
      };
      const response = await genericRequest(nftsRequest);

      setTotalPoints(response.claimedPoints);
      setToClaimPoints(response.totalPoints - response.claimedPoints);
      return response;
    },
    {
      enabled: !!session?.user.token,
      refetchInterval: 60000,
    }
  );

  const stakeNft = async (nft_id: string) => {
    const nft = nfts.find((nft) => nft.id === nft_id);
    if (nft) {
      setNftDraggable([nft_id], false);
      if (timerRef.current) clearTimeout(timerRef.current);
      setShouldFetch(false);
      const tmpStaked = stakedNfts;
      const tmpNfts = nfts;
      setStakedNfts([...stakedNfts, nft]);
      setNfts(nfts.filter((nft) => nft.id !== nft_id));
      try {
        const transactions = await stakeNfts([new PublicKey(nft_id)], wallet);

        if (!transactions || transactions.length == 0) {
          throw new Error("error staking anchor");
        }
        const nftsRequest: GenericRequest = {
          method: "POST",
          url: "/nft/stake",
          token: session?.user.token!,
          data: { mints: [nft_id], serialized: transactions },
        };
        const response = await genericRequest(nftsRequest);
        if (!response.success) {
          throw new Error("error staking back");
        }

        toast(
          <div className="py-4 px-8 w-full text-center bg-success border-2 rounded-xl origin-bottom-right">
            <p className=" font-bozo text-[22px] ">Staking was successful!</p>
          </div>,
          {
            duration: 3000,
          }
        );
      } catch (error) {
        toast(
          <div className="py-4 px-8 w-full text-center bg-error border-2 rounded-xl origin-bottom-right">
            <p className=" font-bozo text-[22px] ">Staking was unsuccessful!</p>
          </div>,
          {
            duration: 3000,
          }
        );
        setStakedNfts(tmpStaked);
        setNfts(tmpNfts);
        console.log(error);
      } finally {
        timerRef.current = setTimeout(() => {
          setShouldFetch(true);
        }, 10000);
      }
    }
  };

  const unstakeAllNfts = async () => {
    if (stakedNfts.length == 0) return;
    const publicKeys = stakedNfts.map((nft) => new PublicKey(nft.id));
    const mints = stakedNfts.map((nft) => nft.id);
    setNftDraggable(mints, false);

    if (timerRef.current) clearTimeout(timerRef.current);
    setShouldFetch(false);
    let tmpStaked = stakedNfts;
    let tmpNfts = nfts;
    setNfts([...nfts, ...stakedNfts]);
    setStakedNfts([]);
    try {
      const transactions = await unstakeNfts(publicKeys, wallet);

      if (!transactions || transactions.length == 0) {
        throw new Error("error unstaking anchor");
      }
      const nftsRequest: GenericRequest = {
        method: "POST",
        url: "/nft/unstake",
        token: session?.user.token!,
        data: { mints: mints, serialized: transactions },
      };
      const response = await genericRequest(nftsRequest);
      if (!response.success) {
        const { errorMints } = response;
        const filtered = mints.filter((mint) => !errorMints.includes(mint));

        tmpStaked = tmpStaked.filter((nft) => filtered.includes(nft.id));
        tmpNfts = tmpNfts.filter((nft) => !filtered.includes(nft.id));
        throw new Error("error unstaking back");
      }

      toast(
        <div className="py-4 px-8 w-full text-center bg-success border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Unstaking was successful!</p>
        </div>,
        {
          duration: 3000,
        }
      );
    } catch (error) {
      toast(
        <div className="py-4 px-8 w-full text-center bg-error border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Unstaking was unsuccessful!</p>
        </div>,
        {
          duration: 3000,
        }
      );
      setStakedNfts(tmpStaked);
      setNfts(tmpNfts);
    } finally {
      timerRef.current = setTimeout(() => {
        setShouldFetch(true);
      }, 10000);
    }
  };

  const stakeAllNfts = async () => {
    if (nfts.length == 0) return;
    const publicKeys = nfts.map((nft) => new PublicKey(nft.id));
    const mints = nfts.map((nft) => nft.id);
    setNftDraggable(mints, false);

    if (timerRef.current) clearTimeout(timerRef.current);
    setShouldFetch(false);
    let tmpStaked = stakedNfts;
    let tmpNfts = nfts;
    setNfts([]);
    setStakedNfts([...nfts, ...stakedNfts]);
    try {
      const transactions = await stakeNfts(publicKeys, wallet);

      if (!transactions || transactions.length == 0) {
        throw new Error("error staking anchor");
      }
      const nftsRequest: GenericRequest = {
        method: "POST",
        url: "/nft/stake",
        token: session?.user.token!,
        data: { mints: mints, serialized: transactions },
      };
      const response = await genericRequest(nftsRequest);
      if (!response.success) {
        const { errorMints } = response;
        const filtered = mints.filter((mint) => !errorMints.includes(mint));

        tmpStaked = tmpStaked.filter((nft) => !filtered.includes(nft.id));
        tmpNfts = tmpNfts.filter((nft) => filtered.includes(nft.id));
        throw new Error("error staking back");
      }

      toast(
        <div className="py-4 px-8 w-full text-center bg-success border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Staking was successful!</p>
        </div>,
        {
          duration: 3000,
        }
      );
    } catch (error) {
      toast(
        <div className="py-4 px-8 w-full text-center bg-error border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Staking was unsuccessful!</p>
        </div>,
        {
          duration: 3000,
        }
      );
      setStakedNfts(tmpStaked);
      setNfts(tmpNfts);
    } finally {
      timerRef.current = setTimeout(() => {
        setShouldFetch(true);
      }, 10000);
    }
  };

  const unstakeNft = async (nft_id: string) => {
    const nft = stakedNfts.find((nft) => nft.id === nft_id);
    if (nft) {
      setNftDraggable([nft_id], false);
      if (timerRef.current) clearTimeout(timerRef.current);
      setShouldFetch(false);
      const tmpStaked = stakedNfts;
      const tmpNfts = nfts;
      setNfts([...nfts, nft]);
      setStakedNfts(stakedNfts.filter((nft) => nft.id !== nft_id));
      try {
        const transactions = await unstakeNfts([new PublicKey(nft_id)], wallet);

        if (!transactions || transactions.length == 0) {
          throw new Error("error unstaking anchor");
        }
        const nftsRequest: GenericRequest = {
          method: "POST",
          url: "/nft/unstake",
          token: session?.user.token!,
          data: { mints: [nft_id], serialized: transactions },
        };
        const response = await genericRequest(nftsRequest);
        if (!response.success) {
          throw new Error("error unstaking back");
        }

        toast(
          <div className="py-4 px-8 w-full text-center bg-success border-2 rounded-xl origin-bottom-right">
            <p className=" font-bozo text-[22px] ">Unstaking was successful!</p>
          </div>,
          {
            duration: 3000,
          }
        );
      } catch (error) {
        console.log(error);
        toast(
          <div className="py-4 px-8 w-full text-center bg-error border-2 rounded-xl origin-bottom-right">
            <p className=" font-bozo text-[22px] ">
              Unstaking was unsuccessful!
            </p>
          </div>,
          {
            duration: 3000,
          }
        );
        setStakedNfts(tmpStaked);
        setNfts(tmpNfts);
      } finally {
        timerRef.current = setTimeout(() => {
          setShouldFetch(true);
        }, 10000);
      }
    }
  };

  const claimPoints = async () => {
    if (toClaimPoints == 0) return;
    const nftsRequest: GenericRequest = {
      method: "GET",
      url: "/nft/claimPoints",
      token: session?.user.token!,
    };
    const response = await genericRequest(nftsRequest);

    if (response.success) {
      toast(
        <div className="py-4 px-8 w-full text-center bg-beige border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Claimed points:</p>

          <p className=" font-bozo text-[22px] text-primary">
            {Math.trunc(toClaimPoints * 100) / 100}
          </p>
        </div>,
        {
          duration: 3000,
        }
      );
      setTotalPoints(response.claimedPoints);
      setToClaimPoints(response.totalPoints - response.claimedPoints);
      updateSession({
        claimedPoints: response.claimedPoints,
        points: response.totalPoints,
      });
    } else {
      toast(
        <div className="py-4 px-8 w-full text-center bg-error border-2 rounded-xl origin-bottom-right">
          <p className=" font-bozo text-[22px] ">Claiming was unsuccessful!</p>
        </div>,
        {
          duration: 3000,
        }
      );
    }
  };

  return (
    <main className="select-none overflow-y-clip md:max-w-screen overflow-x-hidden min-h-screen md:max-h-screen md:h-screen">
      <LoyaltyProvider>
        <div className="w-screen h-full md:max-h-screen md:overflow-hidden p-7 pb-0 flex flex-col justify-between">
          <div className="w-full flex mb-2 md:mb-7 flex-col md:flex-row gap-2 md:gap-0 h-[15%]">
            <div className="w-full md:w-1/3 md:order-1 order-2 flex justify-center md:justify-start">
              <ul className="list-disc text-[20px] ml-4 w-fit">
                <li className="w-fit">1 Bozo gives 1 point / hour</li>
                <li className="w-fit">Every 5 Bozos give a bonus</li>

                <li className="w-fit">
                  <p className="flex">
                    You will earn&nbsp;
                    <span className=" text-primary">
                      {calcolaPunteggio(stakedNfts.length)}
                    </span>
                    &nbsp;points / day
                  </p>
                </li>
              </ul>
            </div>
            <div className="md:w-1/3 w-full md:order-2 order-1">
              <Header title="Loyalty" />
            </div>
            <div className="w-full md:w-1/3 flex justify-center md:justify-end order-3">
              <WalletComponents points={Math.trunc(totalPoints * 100) / 100} />
            </div>
          </div>
          <Stake
            stakedNfts={stakedNfts}
            stakeNft={stakeNft}
            unstakeAllNfts={unstakeAllNfts}
            isNftsDraggable={isNftsDraggable}
          />
          <div className="flex flex-col md:flex-row min-w-full md:min-h-[45%] md:max-h-[45%] md:h-[45vh]">
            <div className="w-full flex md:hidden pb-6 pt-2 justify-between items-center">
              <Button text="Claim !!!" />

              <div
                className="flex text-center max-h-[60px] center relative"
                /* style={{
                  backgroundImage:
                    "url('/img/dashboard/loyalty/circlepoints.svg')",
                }} */
              >
                <Image
                  src="/img/dashboard/loyalty/circlepoints.svg"
                  alt="livellobozo1"
                  className="min-w-full absolute mx-auto"
                  fill
                  sizes="100vw"
                />

                <div className="p-10 max-w-[200px]">
                  <p className="text-[25px]  text-primary">
                    {Math.trunc(toClaimPoints * 100) / 100}
                  </p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 xl:w-1/3 h-full w-full">
              <NftBox
                nfts={nfts}
                unstakeNft={unstakeNft}
                stakeAllNfts={stakeAllNfts}
                isNftsDraggable={isNftsDraggable}
              />
            </div>

            <div className="md:w-1/2 xl:w-1/3 w-full  md:flex center hidden">
              <div className="md:w-fit m-auto flex flex-row md:flex-col justify-between md:justify-center items-center text-center gap-2 py-4 md:py-0">
                <p className="text-[20px] md:text-[40px]">Your Stupid Points</p>
                <div className="relative  md:w-full pt-2 ">
                  {/* <Image
                  src="/img/dashboard/loyalty/circlepoints.svg"
                  alt="livellobozo1"
                  className="min-w-full absolute mx-auto"
                  fill
                /> */}
                  <svg
                    className="min-w-full max-w-full absolute mx-auto top-0 left-0 strokedpoints "
                    width="206"
                    height="62"
                    viewBox="0 0 206 62"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      id="svgcirclepoints"
                      d="M80.8311 53.6222C82.0473 53.3242 83.2505 52.8417 84.4732 52.7566C95.2823 52.047 106.124 51.7135 116.901 50.6563C125.342 49.8262 133.732 48.2723 142.109 46.7822C151.721 45.0722 161.392 43.5538 170.849 41.0917C179.472 38.8425 188.194 36.5365 196.044 31.6619C197.013 31.0588 197.969 30.4344 198.899 29.7675C203.959 26.1204 202.691 21.629 198.996 18.2729C194.229 13.9447 188.35 12.1779 182.438 10.6311C171.2 7.68655 159.773 6.16813 148.261 5.23864C128.692 3.66346 109.129 3.45769 89.5265 4.55038C72.3958 5.50117 55.4407 7.82846 38.6287 11.3975C29.8813 13.2564 21.2119 15.6192 13.1928 19.9971C10.5328 21.4516 8.04841 23.4809 5.83065 25.6663C3.0861 28.3768 3.28121 31.8464 5.82415 34.8407C10.0711 39.8429 15.6902 42.4044 21.2249 45.0439C31.5267 49.9539 42.3033 53.31 53.2815 55.8076C59.5706 57.2338 65.9637 58.0994 72.2983 59.263C73.8396 59.5469 75.355 59.9939 77.0004 60.3983C69.4301 63.5132 62.0029 61.3491 54.6473 60.0577C44.2804 58.2342 34.1282 55.3677 24.3791 51.0182C16.9975 47.7259 9.75237 44.1073 3.72346 38.2536C-2.09733 32.5985 -0.568968 25.2902 4.69251 20.7705C12.3603 14.1788 21.6086 11.3336 30.9934 9.11273C36.0533 7.91361 41.1196 6.73577 46.2185 5.7637C51.3044 4.79872 56.4228 4.05371 61.5412 3.34416C62.7899 3.16678 64.0971 3.49317 64.806 3.54284C66.3734 3.18097 67.466 2.93263 68.5521 2.6701C70.2041 2.27986 72.0641 2.31533 73.56 2.29405C75.7712 2.25857 78.015 0.435053 80.4474 2.09538C81.3644 2.71977 83.1594 1.71932 84.5642 1.5916C88.1542 1.25812 91.7508 0.974295 95.3473 0.711765C99.204 0.435044 103.067 0.0731785 106.93 0.0022245C109.252 -0.0403479 111.574 0.54148 113.902 0.605338C115.652 0.655006 117.408 0.172524 119.157 0.200906C122.012 0.243478 124.861 0.591146 127.716 0.647909C129.537 0.683386 131.501 -0.118391 133.16 0.385382C137.511 1.69803 141.894 0.960114 146.245 1.26522C151.559 1.63418 156.879 2.14504 162.16 2.90425C173.99 4.60005 185.885 6.16814 196.818 11.9154C198.931 13.0294 200.98 14.5691 202.639 16.3713C207.946 22.1541 206.807 29.8739 200.362 34.0673C191.699 39.701 182.217 42.8727 172.448 44.9942C159.916 47.7188 147.292 49.961 134.734 52.5579C122.975 54.9916 111.119 56.1624 99.1715 56.0772C93.6564 56.0346 88.1477 55.3393 82.6326 54.8923C82.0408 54.8426 81.475 54.4807 80.8961 54.2608C80.8766 54.0479 80.8571 53.8351 80.8376 53.6222H80.8311Z"
                      fill="#C8453B"
                    />
                  </svg>
                  <p className="text-[20px] md:text-[40px] text-primary">
                    {Math.trunc(toClaimPoints * 100) / 100}
                  </p>
                </div>
                <Button text="Claim" onClick={() => claimPoints()} />
              </div>
            </div>
            <div className="xl:w-1/3 hidden xl:inline">
              <Image
                src="/img/dashboard/loyalty/livellobozo1.png"
                alt="livellobozo1"
                className="max-h-[40vh] w-auto absolute right-0 bottom-0 -z-10 animate-loyaltyimage"
                width={1052}
                height={652}
              />
            </div>
          </div>
        </div>
      </LoyaltyProvider>
    </main>
  );
}
