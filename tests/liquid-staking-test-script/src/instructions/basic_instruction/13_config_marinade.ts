
import { Connection, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { ConfigMarinadeParam, InitParam, } from "../../types";

const config_marinade = async (connection: Connection, payer: Signer, configMarinadeParam: ConfigMarinadeParam, initParam: InitParam) => {
    const {
        stateAccount,
    } = initParam

    const tx = await program.methods.configMarinade(configMarinadeParam)
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
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("Transaction Signature:", sig);
}

export {
    config_marinade
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
