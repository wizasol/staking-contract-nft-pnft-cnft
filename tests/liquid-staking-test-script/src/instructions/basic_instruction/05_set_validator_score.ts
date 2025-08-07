
import { Connection, PublicKey, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { SetValidatorScore } from "../../types/basic_instruction_types";

const set_validator_score = async (connection: Connection, payer: Signer, setValidatorScore: SetValidatorScore, initParam: InitParam) => {
    const {
        index,
        validatorVote,
        score
    } = setValidatorScore;

    const {
        stateAccount,
        validatorList
    } = initParam
    const tx = await program.methods
        .setValidatorScore(index, validatorVote, score)
        .accounts({
            state: stateAccount.publicKey,
            managerAuthority: payer.publicKey,
            validatorList: validatorList.publicKey,
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
    set_validator_score
}

//? Define the parameters for initializing the state
// interface SetValidatorScore {
//     index : number,
//     validatorVote : PublicKey,
//     score : number
// }
