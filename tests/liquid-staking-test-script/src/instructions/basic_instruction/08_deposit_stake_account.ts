
import { Authorized, Connection, PublicKey, sendAndConfirmTransaction, Signer, StakeProgram, Transaction } from "@solana/web3.js";
import { program } from "../../config";
import { DepositStakeParam, InitParam } from "../../types";
import { voteAccount } from "../../constant";

const deposit_stake_account = async (connection: Connection, payer: Signer, depositStakeParam: DepositStakeParam, initParam: InitParam) => {
    const {
        validatorIndex,
        amount
    } = depositStakeParam;

    const {
        stateAccount,
        msolMint,
        mint_to,
        authorityMsolAcc,
        validatorList,
        stakeList,
        stakeAccount,
    } = initParam

    const validatorVote = voteAccount[validatorIndex];

    const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote.toBuffer()], program.programId)

    const stakeTx = new Transaction()

    stakeTx.add(
        StakeProgram.createAccount(
            {
                authorized: new Authorized(payer.publicKey, payer.publicKey,),
                fromPubkey: payer.publicKey,
                stakePubkey: stakeAccount.publicKey,
                lamports: amount,
            }
        )
    )

    stakeTx.add(
        StakeProgram.delegate({
            stakePubkey: stakeAccount.publicKey,
            authorizedPubkey: payer.publicKey,
            votePubkey: validatorVote,
        })
    )

    stakeTx.feePayer = payer.publicKey;
    stakeTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Send the transaction
    const stakeSig = await sendAndConfirmTransaction(connection, stakeTx, [payer , stakeAccount]);

    console.log("Deligate Transaction Signature:", stakeSig);

    const tx = new Transaction()

    tx.add(
        await program.methods.depositStakeAccount(validatorIndex)
            .accounts({
                state: stateAccount.publicKey,
                validatorList: validatorList.publicKey,
                stakeList: stakeList.publicKey,
                stakeAccount: stakeAccount.publicKey,
                stakeAuthority: payer.publicKey,
                duplicationFlag: duplicationFlag,      //  Double check
                msolMint: msolMint,
                mintTo: mint_to,
                msolMintAuthority: authorityMsolAcc,
                stakeProgram: StakeProgram.programId
            })
            .signers([payer])
            .transaction()
    )


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
    deposit_stake_account
}

//? Define the parameters for initializing the state
// interface DepositParam {
//     amount : BN
// }
