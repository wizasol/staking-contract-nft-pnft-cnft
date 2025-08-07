
import { Connection, PublicKey, sendAndConfirmTransaction, Signer, StakeProgram } from "@solana/web3.js";
import { program } from "../../config";
import { AddLiquidityParam, DepositStakeParam, InitParam, LiquidUnstakeParam } from "../../types";

const add_liquidity = async (connection: Connection, payer: Signer, addLiquidityParam: AddLiquidityParam, initParam: InitParam) => {
    const {
        lamports
    } = addLiquidityParam;

    const {
        stateAccount,
        lpMint,
        mint_to_lp,
        solLegPda,
        mSolLeg,
        authorityLpAcc,
    } = initParam

    // Retrieve and log the state account to confirm initialization
    const state = await program.account.state.fetch(stateAccount.publicKey);
    console.log("State Account:", state); //  this data

    const tx = await program.methods.addLiquidity(lamports)
        .accounts({
            state: stateAccount.publicKey,
            lpMint: lpMint,
            lpMintAuthority: authorityLpAcc,
            liqPoolMsolLeg: mSolLeg,
            liqPoolSolLegPda: solLegPda,
            transferFrom: payer.publicKey,
            mintTo: mint_to_lp,
        })
        .signers([payer])
        .transaction()

    // Set fee payer and recent blockhash
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Simulate the transaction to catch errors
    const simulationResult = await connection.simulateTransaction(tx);
    console.log("Simulation Result:", simulationResult);

    // Send the transaction
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("Transaction Signature:", sig);
}

export {
    add_liquidity
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
