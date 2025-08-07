
import { Connection, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam } from "../../types";
import { ChangeAuthorityData } from "../../types/basic_instruction_types";

const change_authority = async (connection: Connection, payer: Signer, changeAuthorityData: ChangeAuthorityData, initParam: InitParam) => {

    const {
        stateAccount,
    } = initParam;

    //  @ts-ignore
    const tx = await program.methods.changeAuthority(changeAuthorityData)
        .accounts({
            state: stateAccount.publicKey,
            adminAuthority: payer.publicKey
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
    change_authority
}

//? Define the parameters for initializing the state
// const changeAuthorityData = {
//     admin: payer.publicKey,
//     validatorManager: payer.publicKey,
//     operationalSolAccount: operationalSolAccount,
//     treasuryMsolAccount: treasuryMsolAccount,
//     pauseAuthority: payer.publicKey
// }