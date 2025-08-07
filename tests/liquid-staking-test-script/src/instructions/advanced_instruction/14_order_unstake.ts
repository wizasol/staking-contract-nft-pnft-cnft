
import { Connection, sendAndConfirmTransaction, Signer } from "@solana/web3.js";
import { program } from "../../config";
import { InitParam, OrderUnstakeParam } from "../../types";

const order_unstake = async (connection: Connection, payer: Signer, orderUnstakeParam: OrderUnstakeParam, initParam: InitParam) => {


    const {
        msol_amount,
        newTicketAccount
    } = orderUnstakeParam

    const {
        stateAccount,
        msolMint,
        burnMsolFrom,
    } = initParam

    const tx = await program.methods.orderUnstake(msol_amount)
        .accounts({
            state: stateAccount.publicKey,
            msolMint: msolMint,
            burnMsolFrom: burnMsolFrom,
            burnMsolAuthority: payer.publicKey,
            newTicketAccount: newTicketAccount.publicKey
        })
        .preInstructions([
            await program.account.ticketAccountData.createInstruction(newTicketAccount)
        ])
        .signers([payer])
        .transaction()

    // Set fee payer and recent blockhash
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Simulate the transaction to catch errors
    const simulationResult = await connection.simulateTransaction(tx);
    console.log("Simulation Result:", simulationResult);

    // Send the transaction
    const sig = await sendAndConfirmTransaction(connection, tx, [payer, newTicketAccount]);
    console.log("Transaction Signature:", sig);
}

export {
    order_unstake
}

//? Define the parameters for initializing the state
// const initializeData : InitializeDataParam = {
//     adminAuthority: authorityAcc.publicKey,
//     validatorManagerAuthority: payer.publicKey,
//     minStake: new BN(10000000), // Example value
//     rewardsFee: { numerator: 1, denominator: 100 }, // 1%
//     liqPool: {
//         lpLiquidityTarget: new BN(50000000000),
//         lpMaxFee: { basisPoints: new BN(1) },
//         lpMinFee: { basisPoints: new BN(1) },
//         lpTreasuryCut: { basisPoints: new BN(1) },
//     },
//     additionalStakeRecordSpace: 3,
//     additionalValidatorRecordSpace: 3,
//     slotsForStakeDelta: new BN(3000),
//     pauseAuthority: payer.publicKey,
// };