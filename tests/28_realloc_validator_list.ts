import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
import {
    Keypair,
    PublicKey,
    Connection,
    sendAndConfirmTransaction,
    Transaction,
    StakeProgram,
    SystemProgram,
    Authorized,
    LAMPORTS_PER_SOL,
    SYSVAR_STAKE_HISTORY_PUBKEY,
    STAKE_CONFIG_ID,
    Lockup,
    EpochSchedule,
    SYSVAR_EPOCH_SCHEDULE_PUBKEY,
    ComputeBudgetProgram
} from '@solana/web3.js';
import {
    createMint,
    mintTo,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccount,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { BN } from "bn.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { authorityAcc, connection, lpMint, mint_to, mSolLeg, msolMint, operationalSolAccount, payer, stakeAccount, stakeAuthority, stakeList, stateAccount, treasuryMsolAccount, validatorList, voteAccount } from ".";

describe("marinade-forking-smart-contract", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

    // * -------------------------------------------------------------------------------------
    // *  Advanced Instructions
    // * -------------------------------------------------------------------------------------
    // * realloc_validator_list : realloc_validator_list from liq pool
    // * 
    // * ================== Required ===================
    // * State state should be "resume"
    // * 
    // * 
    // * ===============================================
    // * Tx Route : initialize / realloc_validator_list
    // * -------------------------------------------------------------------------------------
   
  //  ** Missing Part
  it("realloc_validator_list", async () => {
    const tx = await program.methods.reallocValidatorList(10)
      .accounts({
        state: stateAccount.publicKey,
        adminAuthority: authorityAcc.publicKey,
        validatorList: validatorList.publicKey,
        rentFunds: payer.publicKey,
      })
      .signers([authorityAcc , payer])
      .transaction()
    // Set fee payer and recent blockhash
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    // Simulate the transaction to catch errors
    const simulationResult = await connection.simulateTransaction(tx);
    console.log("Simulation Result:", simulationResult);
    // Send the transaction
    const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, authorityAcc, validatorList]);
    console.log("Transaction Signature:", sig);
  })
});
