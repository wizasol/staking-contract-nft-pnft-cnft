
import { Connection, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { ConfigLpParam, InitParam, } from "../../types";

const config_lp = async (connection: Connection, payer: Signer, configLpParam: ConfigLpParam, initParam: InitParam) => {
    const {
        stateAccount,
    } = initParam

    const tx = await program.methods.configLp(configLpParam)
            .accounts({
                state: stateAccount.publicKey,
                adminAuthority: payer.publicKey,
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
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, payer]);
        console.log("Transaction Signature:", sig);
}

export {
    config_lp
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
