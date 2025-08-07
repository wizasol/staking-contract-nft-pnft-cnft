
import { Connection, PublicKey, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { ConfigValidatorSystem, SetValidatorScore } from "../../types/basic_instruction_types";

const config_validator_system = async (connection: Connection, payer: Signer, configValidatorSystem: ConfigValidatorSystem, initParam: InitParam) => {
    const {
        extra_runs
    } = configValidatorSystem

    const {
        stateAccount
    } = initParam
    const tx = await program.methods
        .configValidatorSystem(extra_runs)
        .accounts({
            state: stateAccount.publicKey,
            managerAuthority: payer.publicKey,
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

    //   // Retrieve and log the state account to confirm initialization
    const state = await program.account.state.fetch(stateAccount.publicKey);
    console.log("State Account:", state); //  this data
}

export {
    config_validator_system
}

//? Define the parameters for initializing the state
// interface ConfigValidatorSystem {
//     extra_runs : number
// }
