
import { Connection, PublicKey, sendAndConfirmTransaction, Signer, StakeProgram } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, RemoveLiquidityParam } from "../../types";

const remove_liquidity = async (connection: Connection, payer: Signer, removeLiquidityParam: RemoveLiquidityParam, initParam: InitParam) => {
    const {
        tokens
    } = removeLiquidityParam;

    const {
        stateAccount,
        lpMint,
        authorityMSolLegAcc,
        solLegPda,
        mSolLeg,
        mint_to,
        mint_to_lp
    } = initParam

    const tx = await program.methods.removeLiquidity(tokens)
        .accounts({
            state: stateAccount.publicKey,
            lpMint: lpMint,
            burnFrom: mint_to_lp,
            burnFromAuthority: payer.publicKey,
            transferSolTo: payer.publicKey,
            transferMsolTo: mint_to,
            liqPoolSolLegPda: solLegPda,
            liqPoolMsolLeg: mSolLeg,
            liqPoolMsolLegAuthority: authorityMSolLegAcc,
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
    remove_liquidity
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
