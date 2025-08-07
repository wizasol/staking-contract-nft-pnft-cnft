
import { Connection, PublicKey, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { RemoveValidatorParam } from "../../types/basic_instruction_types";

const remove_validator = async (connection: Connection, payer: Signer, removeValidatorParam: RemoveValidatorParam, initParam: InitParam) => {
    const {
        voteAccount
    } = removeValidatorParam

    const {
        stateAccount,
        validatorList,
        operationalSolAccount
    } = initParam

    const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), voteAccount.toBuffer()], program.programId)

    const tx = await program.methods
        .removeValidator(0, voteAccount)
        .accounts({
            state: stateAccount.publicKey,
            managerAuthority: payer.publicKey,
            validatorList: validatorList.publicKey,
            duplicationFlag: duplicationFlag,
            operationalSolAccount: operationalSolAccount.publicKey,
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
    remove_validator
}

//? Define the parameters for initializing the state
// const removeValidatorParam = {
//     voteAccount: voteAccount[2]
// }