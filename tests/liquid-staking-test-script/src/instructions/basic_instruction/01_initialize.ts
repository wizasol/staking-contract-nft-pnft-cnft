
import { Connection, PublicKey, sendAndConfirmTransaction, Signer, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { contractAddr, program } from "../../config";
import { BN } from "bn.js";
import {  InitializeDataParam, InitParam } from "../../types";

const initialize = async (connection: Connection, payer: Signer , initializeData : InitializeDataParam , initParam : InitParam) => {

    const {
        stateAccount,
        msolMint,
        stakeList,
        validatorList,
        operationalSolAccount,
        treasuryMsolAccount,
        lpMint,
        mSolLeg
    } = initParam

    const [reservePda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("reserve")], contractAddr);
    const [solLegPda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_sol")], contractAddr);

    const tx = await program.methods
        //  @ts-ignore
        .initialize(initializeData)
        .accounts({
            state: stateAccount.publicKey,
            reservePda: reservePda,
            msolMint: msolMint,
            stakeList: stakeList.publicKey,
            validatorList: validatorList.publicKey,
            operationalSolAccount: operationalSolAccount.publicKey,
            treasuryMsolAccount: treasuryMsolAccount,
            liqPool: {
                lpMint: lpMint,
                solLegPda: solLegPda,
                msolLeg: mSolLeg,
            },
            clock: SYSVAR_CLOCK_PUBKEY,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .preInstructions([
            await program.account.state.createInstruction(stateAccount),
            await program.account.state.createInstruction(stakeList),
            await program.account.state.createInstruction(validatorList)
        ])
        .transaction()


    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const simulationResult = await connection.simulateTransaction(tx);
    console.log("Simulation Result:", simulationResult);

    const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, stakeList, validatorList]);
    console.log("Transaction Signature:", sig);

    const state = await program.account.state.fetch(stateAccount.publicKey);
    console.log("State Account:", state);

}

export {
    initialize
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