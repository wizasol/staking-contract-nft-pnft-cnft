import { createAtaTx } from "./createAtaTx";
import { createMintTrasaction  } from "./createMintTrasaction";
import { getInitParam } from "./outPut";

const sleep = async (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

export {
    createMintTrasaction,
    createAtaTx,
    getInitParam,
    sleep
}