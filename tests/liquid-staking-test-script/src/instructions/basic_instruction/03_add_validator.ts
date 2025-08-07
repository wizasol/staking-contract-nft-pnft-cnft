
import { Connection, PublicKey, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { AddValidatorParam, ChangeAuthorityData } from "../../types/basic_instruction_types";

const add_validator = async (connection: Connection, payer: Signer, addValidatorParam: AddValidatorParam, initParam: InitParam) => {
    const {
        score,
        voteAccount
    } = addValidatorParam

    const {
        stateAccount,
        validatorList
    } = initParam

    const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), voteAccount.toBuffer()], program.programId)

    const tx = await program.methods
        .addValidator(score)
        .accounts({
            state: stateAccount.publicKey,
            managerAuthority: payer.publicKey,
            validatorList: validatorList.publicKey,
            validatorVote: voteAccount,
            duplicationFlag: duplicationFlag,
        })
        .signers([payer])
        .transaction()

    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const simulationResult = await connection.simulateTransaction(tx);
    console.log("Simulation Result:", simulationResult);

    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("Transaction Signature:", sig);

    const state = await program.account.state.fetch(stateAccount.publicKey);
    console.log("State Account:", state); //  this data
}

export {
    add_validator
}

//? Define the parameters for initializing the state
// const addValidatorParam = {
//     score: 2,
//     voteAccount: voteAccount[2]
// }