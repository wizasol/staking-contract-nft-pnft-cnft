
import { Connection, PublicKey, sendAndConfirmTransaction, Signer, StakeProgram } from "@solana/web3.js";
import { program } from "../../config";
import { DepositStakeParam, InitParam, LiquidUnstakeParam } from "../../types";

const liquid_unstake = async (connection: Connection, payer: Signer, liquidUnstakeParam: LiquidUnstakeParam, initParam: InitParam) => {
    const {
        msol_amount
    } = liquidUnstakeParam;

    const {
        stateAccount,
        msolMint,
        mint_to,
        solLegPda,
        mSolLeg,
        treasuryMsolAccount,
    } = initParam

    const tx = await program.methods.liquidUnstake(msol_amount)
        .accounts({
            state: stateAccount.publicKey,
            msolMint: msolMint,
            liqPoolSolLegPda: solLegPda,
            liqPoolMsolLeg: mSolLeg,
            treasuryMsolAccount: treasuryMsolAccount,
            getMsolFrom: mint_to,
            getMsolFromAuthority: payer.publicKey,
            transferSolTo: payer.publicKey,
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
    liquid_unstake
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
