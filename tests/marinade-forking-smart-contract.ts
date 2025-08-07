// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { MarinadeForkingSmartContract } from "../target/types/marinade_forking_smart_contract";
// import {
//   Keypair,
//   PublicKey,
//   Connection,
//   sendAndConfirmTransaction,
//   Transaction,
//   StakeProgram,
//   SystemProgram,
//   Authorized,
//   LAMPORTS_PER_SOL,
//   SYSVAR_STAKE_HISTORY_PUBKEY,
//   STAKE_CONFIG_ID,
//   Lockup,
//   EpochSchedule,
//   SYSVAR_EPOCH_SCHEDULE_PUBKEY,
//   ComputeBudgetProgram
// } from '@solana/web3.js';
// import {
//   createMint,
//   mintTo,
//   getOrCreateAssociatedTokenAccount,
//   createAssociatedTokenAccount,
//   getAssociatedTokenAddressSync,
//   createAssociatedTokenAccountInstruction,
//   createMintToInstruction,
//   getAssociatedTokenAddress,
//   TOKEN_PROGRAM_ID
// } from '@solana/spl-token';
// import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
// import { BN } from "bn.js";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// const payer = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "));
// const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=f74ec75c-56ba-49df-b67b-71637bf8d115"); // Change to your localnet RPC

// describe("marinade-forking-smart-contract", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

//   let msolMint;
//   let mSolLeg;
//   let lpMint;
//   let treasuryMsolAccount;
//   // let msolMint = new PublicKey("i8CSXnSWENj7jnkTpDvm1Htd7axLAAByYFcsYa5Qn1m");
//   // let mSolLeg = new PublicKey("AgVUwTtz16WdemasDyHw7SqrquS93qHZAdUb9rWrZZVU")
//   // let lpMint = new PublicKey("EaDBpWrywPGhW6HSCvznarnLr53mfF2v1Z4EEYKkSyNt");
//   // let treasuryMsolAccount = new PublicKey("Hq4fzSWGepX2TKue7s5nCqp7PPAg9todYSjTBbgcVHJn");
//   console.log({
//     "msolMint : ": msolMint,
//     "mSolLeg : ": mSolLeg,
//     "lpMint : ": lpMint,
//     "treasuryMsolAccount : ": treasuryMsolAccount,
//   });


//   const stateAccount = Keypair.generate()
//   const stakeList = Keypair.generate()
//   const validatorList = Keypair.generate()
//   const operationalSolAccount = Keypair.generate()
//   const authorityAcc = Keypair.generate()
// //   // const stateAccount = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "))
// //   // const stakeList = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "))
// //   // const validatorList = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "))
// //   // const operationalSolAccount = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "))
// //   // const authorityAcc = Keypair.fromSecretKey(bs58.decode(" **** PRIVATE HERE **** "))
//   console.log("stateAccount", bs58.encode(operationalSolAccount.secretKey));
//   console.log("stakeList", bs58.encode(validatorList.secretKey));
//   console.log("validatorList", bs58.encode(stakeList.secretKey));
//   console.log("operationalSolAccount", bs58.encode(stateAccount.secretKey));
//   console.log("authorityAcc", bs58.encode(authorityAcc.secretKey));

//   const [authorityMsolAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("st_mint")], program.programId);
//   const [reservePda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("reserve")], program.programId);
//   const [authorityLpAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_mint")], program.programId);
//   const [authorityMSolLegAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_st_sol_authority")], program.programId);
//   const [solLegPda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_sol")], program.programId);
//   const [stakeDepositAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("deposit")], program.programId)
//   const [stakeWithdrawAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("withdraw")], program.programId);
//   console.log({
//     "authorityMsolAcc : ": authorityMsolAcc,
//     "reservePda : ": reservePda,
//     "authorityLpAcc : ": authorityLpAcc,
//     "authorityMSolLegAcc : ": authorityMSolLegAcc,
//     "solLegPda : ": solLegPda,
//   });

// //   // * -------------------------------------------------------------------------------------
// //   // *  Base Instructions
// //   // * -------------------------------------------------------------------------------------
// //   // * Advanced instructions: deposit-stake-account, Delayed-Unstake
// //   // * backend/bot "crank" related functions:
// //   // * order_unstake (starts stake-account deactivation)
// //   // * withdraw (delete & withdraw from a deactivated stake-account)
// //   // * -------------------------------------------------------------------------------------
// //*         02-initialize
//   it("initialize", async () => {

//     console.log("===================================================");

//     // Airdrop SOL to accounts
//     console.log(await connection.requestAirdrop(reservePda, 2_039_280));
//     console.log("reservePda : ", reservePda);
//     console.log(await connection.requestAirdrop(solLegPda, 2_039_280));

//     console.log("===================================================");
//     // Create MSOL mint
//     msolMint = await createMint(connection, payer, authorityMsolAcc, null, 9);
//     lpMint = await createMint(connection, payer, authorityLpAcc, null, 9);

//     console.log("===================================================");
//     // Create associated token account for treasury MSOL
//     treasuryMsolAccount = await getOrCreateAssociatedTokenAccount(connection, payer, msolMint, stateAccount.publicKey);
//     console.log("**************************");
//     mSolLeg = await getOrCreateAssociatedTokenAccount(connection, payer, msolMint, authorityMSolLegAcc, true);
//     console.log("**************************");

//     console.log({
//       "msolMint : ": msolMint,
//       "mSolLeg : ": mSolLeg,
//       "lpMint : ": lpMint,
//       "treasuryMsolAccount : ": treasuryMsolAccount,
//     });


//     // // Define the parameters for initializing the state
//     const initializeData = {
//       adminAuthority: authorityAcc.publicKey,
//       validatorManagerAuthority: payer.publicKey,
//       minStake: new anchor.BN(10000000), // Example value
//       rewardsFee: { numerator: 1, denominator: 100 }, // 1%
//       liqPool: {
//         lpLiquidityTarget: new anchor.BN(50000000000),
//         lpMaxFee: { basisPoints: new anchor.BN(1) },
//         lpMinFee: { basisPoints: new anchor.BN(1) },
//         lpTreasuryCut: { basisPoints: new anchor.BN(1) },
//       },
//       additionalStakeRecordSpace: 3,
//       additionalValidatorRecordSpace: 3,
//       slotsForStakeDelta: new anchor.BN(3000),
//       pauseAuthority: payer.publicKey,
//     };

//     const tx = await program.methods
//       .initialize(initializeData)
//       .accounts({
//         state: stateAccount.publicKey,
//         reservePda: reservePda,
//         msolMint: msolMint,
//         stakeList: stakeList.publicKey,
//         validatorList: validatorList.publicKey,
//         operationalSolAccount: operationalSolAccount.publicKey,
//         treasuryMsolAccount: treasuryMsolAccount.address,
//         liqPool: {
//           lpMint: lpMint,
//           solLegPda: solLegPda,
//           msolLeg: mSolLeg.address,
//         },
//         clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//       })
//       .preInstructions([
//         await program.account.state.createInstruction(stateAccount),
//         await program.account.state.createInstruction(stakeList),
//         await program.account.state.createInstruction(validatorList)
//       ])
//       .transaction()



//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, stakeList, validatorList]);
//     console.log("Transaction Signature:", sig);

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data
//   });


// //?         14-change_authority ( Missing )
//   it("change_authority", async () => {
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data

//     const admin = Keypair.generate().publicKey
//     const validatorManager = Keypair.generate().publicKey
//     const operationalSolAccount = Keypair.generate().publicKey
//     const treasuryMsolAccount = Keypair.generate().publicKey
//     const pauseAuthority = Keypair.generate().publicKey

//     console.log({
//       reservePda: reservePda,
//       authorityAcc: authorityAcc,
//       authorityLpAcc: authorityLpAcc,
//       authorityMSolLegAcc: authorityMSolLegAcc,
//       solLegPda: solLegPda,
//     });


//     const changeAuthorityData = {
//       admin: admin,
//       validatorManager: validatorManager,
//       operationalSolAccount: operationalSolAccount,
//       treasuryMsolAccount: treasuryMsolAccount,
//       pauseAuthority: pauseAuthority
//     }

//     console.log(stateAccount.publicKey);

//     const tx = await program.methods.changeAuthority(changeAuthorityData)
//       .accounts({
//         state: stateAccount.publicKey,
//         adminAuthority: authorityAcc.publicKey
//       })
//       .signers([authorityAcc])
//       .transaction()


//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, authorityAcc]);
//     console.log("Transaction Signature:", sig);
//   })
//   const validatorVote = new PublicKey("96hq7DZEAQBAL9eYvgfSmKjzXY24D6jUnDQNi7hb149H")
//   const validatorVote1 = new PublicKey("AuY1iYSfb7HL7io3fw8q9Vyr8xahmjMvrPf9dC41Z9zd")
//   const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote.toBuffer()], program.programId)
//   const [duplicationFlag1] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote1.toBuffer()], program.programId)

// //*         03-add_validator
//   it("add_validator", async () => {

//     console.log({
//       state: stateAccount.publicKey,
//       managerAuthority: payer.publicKey,
//       validatorList: validatorList.publicKey,
//       validatorVote: validatorVote,
//       duplicationFlag: duplicationFlag,
//     });

//     const tx = await program.methods
//       .addValidator(0)
//       .accounts({
//         state: stateAccount.publicKey,
//         managerAuthority: payer.publicKey,
//         validatorList: validatorList.publicKey,
//         validatorVote: validatorVote,
//         duplicationFlag: duplicationFlag,
//       })
//       .signers([payer])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data
//   })

// //*         04-remove_validator
//   it("remove_validator", async () => {

//     const [duplicationFlag] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("unique_validator"), validatorVote.publicKey.toBuffer()], program.programId)

//     const tx = await program.methods
//       .removeValidator(0, validatorVote.publicKey)
//       .accounts({
//         state: stateAccount.publicKey,
//         managerAuthority: payer.publicKey,
//         validatorList: validatorList.publicKey,
//         duplicationFlag: duplicationFlag,
//         operationalSolAccount: operationalSolAccount.publicKey,
//       })
//       .signers([payer])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data
//   })

// //*         05-set_validator_score
//   it("set_validator_score", async () => {

//     const tx = await program.methods
//       .setValidatorScore(0, validatorVote.publicKey , 2)
//       .accounts({
//         state: stateAccount.publicKey,
//         managerAuthority: payer.publicKey,
//         validatorList: validatorList.publicKey,
//       })
//       .signers([payer])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data
//   })

// //*         06-config_validator_system
//   it("config_validator_system", async () => {

//     const tx = await program.methods
//       .configValidatorSystem( 3 )
//       .accounts({
//         state: stateAccount.publicKey,
//         managerAuthority: payer.publicKey,
//       })
//       .signers([payer])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data
//   })

//   let mint_to;
// //*         07-deposit
//   it("deposit", async () => {

//     console.log(await connection.requestAirdrop(stakeAuthority.publicKey, 1_000_000));
//     console.log(await connection.getBalance(stakeAuthority.publicKey));
//     // // Create associated token account for minting
//     mint_to = await createAssociatedTokenAccount(connection, payer, msolMint, stakeAuthority.publicKey);
//     console.log("stakeAuthority : ", stakeAuthority.publicKey, " mint_to : ", mint_to, " authorityMsolAcc , ", authorityMsolAcc);

//     const tx = await program.methods.deposit(new BN(10000))
//       .accounts({
//         state: stateAccount.publicKey,
//         msolMint: msolMint,
//         liqPoolSolLegPda: solLegPda,
//         liqPoolMsolLeg: mSolLeg.address,
//         liqPoolMsolLegAuthority: authorityMSolLegAcc,
//         reservePda: reservePda,
//         transferFrom: stakeAuthority.publicKey,
//         mintTo: mint_to,
//         msolMintAuthority: authorityMsolAcc,
//       })
//       .signers([stakeAuthority])
//       .transaction()


//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })

//   const stakeAuthority = Keypair.generate();
//   const stakeAccount = Keypair.generate();
//   const stakeAccount1 = Keypair.generate();

// //*         08-deposit_stake_account
//   it("deposit_stake_account", async () => {
//     const a1 = await connection.requestAirdrop(stakeAuthority.publicKey, 10 ** 12);

//     const sigA1 = await connection.confirmTransaction(a1)

//     console.log(sigA1);
//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount.publicKey));
//     console.log(await connection.getBalance(stakeAuthority.publicKey));

//     // Create a transaction to initialize the stake account
//     const transaction = StakeProgram.createAccount(
//       {
//         authorized: new Authorized(stakeAuthority.publicKey, stakeAuthority.publicKey,),
//         fromPubkey: stakeAuthority.publicKey,
//         stakePubkey: stakeAccount.publicKey,
//         lamports: 9 * (10 ** 11),
//       }
//     )

//     const sig0 = await sendAndConfirmTransaction(connection, transaction, [stakeAuthority, stakeAccount])
//     console.log("init stake account : ", sig0);
//     // Check our newly created stake account balance. This should be 0.5 SOL.
//     let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
//     console.log(`Stake account balance: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);
//     console.log("666666666666666666666666666666666666666666666");
//     const transaction1 = StakeProgram.delegate({
//       stakePubkey: stakeAccount.publicKey,
//       authorizedPubkey: stakeAuthority.publicKey,
//       votePubkey: validatorVote,
//     });
//     const sig1 = await sendAndConfirmTransaction(connection, transaction1, [stakeAuthority])

//     console.log("init stake account : ", sig1);

//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount.publicKey));

//     // Check in on our stake account. It should now be activating.

//     const tx = await program.methods.depositStakeAccount(0)
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeAuthority: stakeAuthority.publicKey,
//         duplicationFlag: Keypair.generate().publicKey,      //  Double check
//         msolMint: msolMint,
//         mintTo: mint_to,
//         msolMintAuthority: authorityMsolAcc,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()


//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);

//   })


//   it("deposit_stake_account", async () => {
//     const a1 = await connection.requestAirdrop(stakeAuthority.publicKey, 10 ** 12);

//     const sigA1 = await connection.confirmTransaction(a1)

//     console.log(sigA1);
//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount1.publicKey));
//     console.log(await connection.getBalance(stakeAuthority.publicKey));

//     // Create a transaction to initialize the stake account
//     const transaction = StakeProgram.createAccount(
//       {
//         authorized: new Authorized(stakeAuthority.publicKey, stakeAuthority.publicKey,),
//         fromPubkey: stakeAuthority.publicKey,
//         stakePubkey: stakeAccount1.publicKey,
//         lamports: 9 * (10 ** 11),
//       }
//     )

//     const sig0 = await sendAndConfirmTransaction(connection, transaction, [stakeAuthority, stakeAccount1])
//     console.log("init stake account : ", sig0);
//     // Check our newly created stake account balance. This should be 0.5 SOL.
//     let stakeBalance = await connection.getBalance(stakeAccount1.publicKey);
//     console.log(`Stake account balance: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);
//     console.log("666666666666666666666666666666666666666666666");
//     const transaction1 = StakeProgram.delegate({
//       stakePubkey: stakeAccount1.publicKey,
//       authorizedPubkey: stakeAuthority.publicKey,
//       votePubkey: validatorVote,
//     });
//     const sig1 = await sendAndConfirmTransaction(connection, transaction1, [stakeAuthority])

//     console.log("init stake account : ", sig1);

//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount1.publicKey));

//     // Check in on our stake account. It should now be activating.

//     const tx = await program.methods.depositStakeAccount(0)
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount1.publicKey,
//         stakeAuthority: stakeAuthority.publicKey,
//         duplicationFlag: Keypair.generate().publicKey,      //  Double check
//         msolMint: msolMint,
//         mintTo: mint_to,
//         msolMintAuthority: authorityMsolAcc,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()


//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);

//   })

// //!         09-add_liquidity ( Error )
//   it("add_liquidity", async () => {

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data

//     const mint_to = await getOrCreateAssociatedTokenAccount(connection, payer, lpMint, stakeAuthority.publicKey)

//     console.log({
//       state: stateAccount.publicKey,
//       "msolMint:": msolMint,
//       "liqPoolSolLegPda:": solLegPda,
//       "liqPoolMsolLeg:": mSolLeg,
//       "treasuryMsolAccount:": treasuryMsolAccount.address,
//       "getMsolFrom:": mint_to,
//       "getMsolFromAuthority:": stakeAuthority.publicKey,
//       "transferSolTo:": stakeAuthority.publicKey,
//     });

//     const tx = await program.methods.addLiquidity(new BN(10_000))
//       .accounts({
//         state: stateAccount.publicKey,
//         lpMint: lpMint,
//         lpMintAuthority: authorityLpAcc,
//         liqPoolMsolLeg: mSolLeg.address,
//         liqPoolSolLegPda: solLegPda,
//         transferFrom: stakeAuthority.publicKey,
//         mintTo: mint_to.address,
//       })
//       .signers([stakeAuthority])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })


// //!         10-liquid_unstake ( Error )
//   it("liquid_unstake", async () => {

//     //   // Retrieve and log the state account to confirm initialization
//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data

//     const mint_to = await getAssociatedTokenAddress(msolMint, stakeAuthority.publicKey)

//     console.log({
//       state: stateAccount.publicKey,
//       msolMint: msolMint,
//       liqPoolSolLegPda: solLegPda,
//       liqPoolMsolLeg: mSolLeg.address,
//       treasuryMsolAccount: treasuryMsolAccount.address,
//       getMsolFrom: mint_to,
//       getMsolFromAuthority: stakeAuthority.publicKey,
//       transferSolTo: stakeAuthority.publicKey,
//     });

//     const tx = await program.methods.liquidUnstake(new BN(100))
//       .accounts({
//         state: stateAccount.publicKey,
//         msolMint: msolMint,
//         liqPoolSolLegPda: solLegPda,
//         liqPoolMsolLeg: mSolLeg.address,
//         treasuryMsolAccount: treasuryMsolAccount.address,
//         getMsolFrom: mint_to,
//         getMsolFromAuthority: stakeAuthority.publicKey,
//         transferSolTo: stakeAuthority.publicKey,
//       })
//       .signers([stakeAuthority])
//       .transaction()




//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })

// //!         11-remove_liquidity ( Error )
//   it("remove_liquidity", async () => {
//     const burnFrom = await getOrCreateAssociatedTokenAccount(connection, payer, lpMint, stakeAuthority.publicKey)
//     const transferMsolTo = await getAssociatedTokenAddress(msolMint, stakeAuthority.publicKey)

//     console.log({
//       state: stateAccount.publicKey,
//       lpMint: lpMint,
//       burnFrom: burnFrom.address,
//       burnFromAuthority: burnFrom.address,
//       transferSolTo: stakeAuthority.publicKey,
//       transferMsolTo: transferMsolTo,
//       liqPoolSolLegPda: solLegPda,
//       liqPoolMsolLeg: mSolLeg.address,
//       liqPoolMsolLegAuthority: authorityMSolLegAcc,
//     });

//     const tx = await program.methods.removeLiquidity(new BN(10_000))
//       .accounts({
//         state: stateAccount.publicKey,
//         lpMint: lpMint,
//         burnFrom: burnFrom.address,
//         burnFromAuthority: stakeAuthority.publicKey,
//         transferSolTo: stakeAuthority.publicKey,
//         transferMsolTo: transferMsolTo,
//         liqPoolSolLegPda: solLegPda,
//         liqPoolMsolLeg: mSolLeg.address,
//         liqPoolMsolLegAuthority: authorityMSolLegAcc,
//       })
//       .signers([stakeAuthority])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })

// //*         12-config_lp
//   it("config_lp", async () => {

//     const state = await program.account.state.fetch(stateAccount.publicKey);
//     console.log("State Account:", state); //  this data

//     const configLpParam = {
//       minFee: { basisPoints: new anchor.BN(2) },  // Correct usage for Fee type
//       maxFee: { basisPoints: new anchor.BN(20) },
//       liquidityTarget: new anchor.BN(70000000000),
//       treasuryCut: { basisPoints: new anchor.BN(30) },
//     };

//     const tx = await program.methods.configLp(configLpParam)
//       .accounts({
//         state: stateAccount.publicKey,
//         adminAuthority: authorityAcc.publicKey,
//       })
//       .signers([authorityAcc])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, authorityAcc]);
//     console.log("Transaction Signature:", sig);

//   })

// //*         13-config_marinade
//   it("config_marinade", async () => {

//     const configMarinadeParam = {
//       rewardsFee: { basisPoints: new BN(1) },
//       slotsForStakeDelta: new BN(5000),
//       minStake: new BN(20000000),
//       minDeposit: new BN(3),
//       minWithdraw: new BN(4),
//       stakingSolCap: new BN(5),
//       liquiditySolCap: new BN(6),
//       withdrawStakeAccountEnabled: true,
//       delayedUnstakeFee: { bpCents: new BN(7) },
//       withdrawStakeAccountFee: { bpCents: new BN(8) },
//       maxStakeMovedPerEpoch: { basisPoints: new BN(9) },
//     };

//     const tx = await program.methods.configMarinade(configMarinadeParam)
//       .accounts({
//         state: stateAccount.publicKey,
//         adminAuthority: authorityAcc.publicKey,
//       })
//       .signers([authorityAcc])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, authorityAcc]);
//     console.log("Transaction Signature:", sig);

//   })


// //   // * -------------------------------------------------------------------------------------
// //   // *  Advanced instructions: deposit-stake-account, Delayed-Unstake
// //   // * -------------------------------------------------------------------------------------
// //   // * backend/bot "crank" related functions:
// //   // * order_unstake (starts stake-account deactivation)
// //   // * withdraw (delete & withdraw from a deactivated stake-account)
// //   // * update (compute stake-account rewards & update mSOL price)
// //   // * -------------------------------------------------------------------------------------


//   const newSplitStakeAccount = Keypair.generate()

// //*         15-partial_unstake
//   it("partial_unstake", async () => {
//     const [stakeDepositAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("deposit")], program.programId)

//     const tx = await program.methods.partialUnstake(0, 0, new BN(10 ** 12))
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorManagerAuthority: payer.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         reservePda: reservePda,
//         splitStakeAccount: newSplitStakeAccount.publicKey,
//         splitStakeRentPayer: stakeAuthority.publicKey,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [stateAccount,
//       payer,
//       validatorList,
//       stakeList,
//       stakeAccount,
//       newSplitStakeAccount,
//       stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })


//   const newTicketAccount = Keypair.generate()

// //  ** 15
//   it("update_active", async () => {
//     const airtx = await connection.requestAirdrop(reservePda, 10000000000 + 2_039_280);

//     await connection.confirmTransaction(airtx)


//     const updateActive = {
//       state: stateAccount.publicKey,
//       stakeList: stakeList.publicKey,
//       stakeAccount: stakeAccount.publicKey,
//       stakeWithdrawAuthority: stakeWithdrawAuthority,
//       reservePda: reservePda,
//       msolMint: msolMint,
//       msolMintAuthority: authorityMsolAcc,
//       treasuryMsolAccount: treasuryMsolAccount.address,
//       stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//       stakeProgram: StakeProgram.programId
//     }

//     const tx = await program.methods.updateActive(0, 0)
//       .accounts({
//         common: updateActive,
//         validatorList: validatorList.publicKey,
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, validatorList]);
//     console.log("Transaction Signature:", sig);
//   })

// //  ** 16
//   it("deactivate_stake", async () => {

//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount.publicKey));

//     const tx = await program.methods.deactivateStake(0, 0)
//       .accounts({
//         state: stateAccount.publicKey,
//         reservePda: reservePda,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         splitStakeAccount: splitStakeAccount.publicKey,
//         splitStakeRentPayer: stakeAuthority.publicKey,
//         epochSchedule: SYSVAR_EPOCH_SCHEDULE_PUBKEY,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAccount,
//       validatorList,
//       stakeList,
//       stakeAccount,
//       splitStakeAccount,
//       stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })


//   const splitStakeAccount = Keypair.generate();

// //  ** 16
//   it("update_deactivated", async () => {

//     const airtx = await connection.requestAirdrop(reservePda, 2_039_280);

//     await connection.confirmTransaction(airtx)


//     const updateActive = {
//       state: stateAccount.publicKey,
//       stakeList: stakeList.publicKey,
//       stakeAccount: stakeAccount.publicKey,
//       stakeWithdrawAuthority: stakeWithdrawAuthority,
//       reservePda: reservePda,
//       msolMint: msolMint,
//       msolMintAuthority: authorityMsolAcc,
//       treasuryMsolAccount: treasuryMsolAccount.address,
//       stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//       stakeProgram: StakeProgram.programId
//     }

//     const tx = await program.methods.updateDeactivated(0)
//       .accounts({
//         common: updateActive,
//         operationalSolAccount: operationalSolAccount.publicKey,
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, operationalSolAccount]);
//     console.log("Transaction Signature:", sig);
//   })

// //  ** 17
//   it("order_unstake", async () => {
//     // const a1 = await connection.requestAirdrop(stakeAuthority.publicKey, 10 ** 12);

//     // const sigA1 = await connection.confirmTransaction(a1)

//     const burnMsolFrom = await getOrCreateAssociatedTokenAccount(connection, stakeAuthority, msolMint, stakeAuthority.publicKey)

//     console.log(burnMsolFrom.address);
//     // const burnMsolAuthority = 

//     console.log({
//       state: stateAccount.publicKey,
//       msolMint: msolMint,
//       burnMsolFrom: burnMsolFrom.address,
//       burnMsolAuthority: stakeAuthority.publicKey,
//       newTicketAccount: newTicketAccount.publicKey,
//     });

//     const tx = await program.methods.orderUnstake(new BN(10 ** 9))
//       .accounts({
//         state: stateAccount.publicKey,
//         msolMint: msolMint,
//         burnMsolFrom: burnMsolFrom.address,
//         burnMsolAuthority: stakeAuthority.publicKey,
//         newTicketAccount: newTicketAccount.publicKey
//       })
//       .preInstructions([
//         await program.account.ticketAccountData.createInstruction(newTicketAccount)
//       ])
//       .signers([stakeAuthority])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority, newTicketAccount]);
//     console.log("Transaction Signature:", sig);
//   })

// //  ** 18
//   it("emergency_unstake", async () => {
//     const tx = await program.methods.emergencyUnstake(0, 0)
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorManagerAuthority: payer.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, validatorList, stakeList, stakeAccount]);
//     console.log("Transaction Signature:", sig);
//   })


//   it("claim", async () => {
//     const airtx1 = await connection.requestAirdrop(newTicketAccount.publicKey, 2_039_280);

//     await connection.confirmTransaction(airtx1)

//     const burnMsolFrom = await getOrCreateAssociatedTokenAccount(connection, stakeAuthority, msolMint, stakeAuthority.publicKey)

//     console.log("start sleeping");
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     console.log({
//       state: stateAccount.publicKey,
//       msolMint: msolMint,
//       burnMsolFrom: burnMsolFrom.address,
//       burnMsolAuthority: payer.publicKey,
//       newTicketAccount: newTicketAccount.publicKey,
//     });

//     const tx = await program.methods.claim()
//       .accounts({
//         state: stateAccount.publicKey,
//         reservePda: reservePda,
//         ticketAccount: newTicketAccount.publicKey,
//         transferSolTo: stakeAuthority.publicKey,
//       })
//       .signers([stakeAuthority])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAuthority, newTicketAccount]);
//     console.log("Transaction Signature:", sig);
//   })

//   const newStakeAccount = Keypair.generate()

//   it("stake_reserve", async () => {

//     const [stakeDepositAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("deposit")], program.programId)

//     const tx = await program.methods.stakeReserve(0)
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         validatorVote: validatorVote,
//         reservePda: reservePda,
//         stakeAccount: newStakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         rentPayer: payer.publicKey,
//         epochSchedule: SYSVAR_EPOCH_SCHEDULE_PUBKEY,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeConfig: STAKE_CONFIG_ID,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()

//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);

//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, validatorList, stakeList, newStakeAccount]);
//     console.log("Transaction Signature:", sig);

//   })


//   //  ** Error in Testing
//   it("deactivate_stake", async () => {

//     console.log("===============> ", await connection.getParsedAccountInfo(stakeAccount.publicKey));

//     const tx = await program.methods.deactivateStake(0, 0)
//       .accounts({
//         state: stateAccount.publicKey,
//         reservePda: reservePda,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         splitStakeAccount: splitStakeAccount.publicKey,
//         splitStakeRentPayer: stakeAuthority.publicKey,
//         epochSchedule: SYSVAR_EPOCH_SCHEDULE_PUBKEY,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stakeAccount,
//       validatorList,
//       stakeList,
//       stakeAccount,
//       splitStakeAccount,
//       stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })


//   it("merge_stakes", async () => {
//     console.log({
//       state: stateAccount.publicKey,
//       stakeList: stakeList.publicKey,
//       validatorList: validatorList.publicKey,
//       destinationStake: stakeAccount.publicKey,
//       sourceStake: stakeAccount1.publicKey,
//       // sourceStake: stakeAccount.publicKey,
//       stakeDepositAuthority: stakeDepositAuthority,
//       stakeWithdrawAuthority: stakeWithdrawAuthority,
//       operationalSolAccount: operationalSolAccount.publicKey,
//     });

//     const tx = await program.methods.mergeStakes(0, 1, 0)
//       .accounts({
//         state: stateAccount.publicKey,
//         stakeList: stakeList.publicKey,
//         validatorList: validatorList.publicKey,
//         destinationStake: stakeAccount.publicKey,
//         sourceStake: stakeAccount1.publicKey,
//         // sourceStake: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         stakeWithdrawAuthority: stakeWithdrawAuthority,
//         operationalSolAccount: operationalSolAccount.publicKey,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, validatorList, stakeList, stakeAccount, stakeAccount1]);
//     console.log("Transaction Signature:", sig);
//   })

//   const newsplitStakeAccount = Keypair.generate()
//   const newsplitStakeAccount1 = Keypair.generate()

// //   / CHECK: Double Check on DEVNET
// //    ** Missing Part
//   it("redelegate", async () => {
//     const [stakeDepositAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("deposit")], program.programId)


//     console.log({
//       state: stateAccount.publicKey,
//       validatorList: validatorList.publicKey,
//       stakeList: stakeList.publicKey,
//       stakeAccount: stakeAccount.publicKey,
//       stakeDepositAuthority: stakeDepositAuthority,
//       reservePda: reservePda,
//       splitStakeAccount: stakeAccount.publicKey,
//       splitStakeRentPayer: stakeAuthority.publicKey,
//       destValidatorAccount: validatorVote,
//       redelegateStakeAccount: newsplitStakeAccount.publicKey,
//       stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//       stakeConfig: STAKE_CONFIG_ID,
//       stakeProgram: StakeProgram.programId
//     });

//     const tx = await program.methods.redelegate(0, 0, 1)
//       .accounts({
//         state: stateAccount.publicKey,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeAccount: stakeAccount.publicKey,
//         stakeDepositAuthority: stakeDepositAuthority,
//         reservePda: reservePda,
//         splitStakeAccount: newsplitStakeAccount.publicKey,
//         splitStakeRentPayer: stakeAuthority.publicKey,
//         destValidatorAccount: validatorVote,
//         redelegateStakeAccount: newsplitStakeAccount1.publicKey,
//         stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//         stakeConfig: STAKE_CONFIG_ID,
//         stakeProgram: StakeProgram.programId
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount,
//       validatorList,
//       stakeList,
//       stakeAccount,
//       newsplitStakeAccount,
//       newsplitStakeAccount1,
//       stakeAuthority,
//       stakeAccount]);
//     console.log("Transaction Signature:", sig);
//   })

//   it("pause", async () => {
//     const tx = await program.methods.pause()
//       .accounts({
//         state: stateAccount.publicKey,
//         pauseAuthority: payer.publicKey,
//       })
//       .signers([payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);
//   })

//   it("resume", async () => {
//     const tx = await program.methods.resume()
//       .accounts({
//         state: stateAccount.publicKey,
//         pauseAuthority: payer.publicKey,
//       })
//       .signers([payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
//     console.log("Transaction Signature:", sig);
//   })

//   it("withdraw_stake_account", async () => {
//     const burnMsolFrom = await getOrCreateAssociatedTokenAccount(connection, stakeAuthority, msolMint, stakeAuthority.publicKey)

//     const airtx = await connection.requestAirdrop(newsplitStakeAccount.publicKey, 10 ** 9)

//     console.log(await connection.confirmTransaction(airtx));
//     console.log({
//       state: stateAccount.publicKey,
//       msolMint: msolMint,
//       burnMsolFrom: burnMsolFrom.address,
//       burnMsolAuthority: payer.publicKey,
//       treasuryMsolAccount: treasuryMsolAccount,
//       validatorList: validatorList.publicKey,
//       stakeList: stakeList.publicKey,
//       stakeWithdrawAuthority: stakeWithdrawAuthority,
//       stakeDepositAuthority: stakeDepositAuthority,
//       stakeAccount: stakeAccount.publicKey,
//       splitStakeAccount: newsplitStakeAccount.publicKey,
//       splitStakeRentPayer: stakeAuthority.publicKey,
//     });

//     const tx = await program.methods.withdrawStakeAccount(0, 0, new BN(10 ** 10), validatorVote)
//       .accounts({
//         state: stateAccount.publicKey,
//         msolMint: msolMint,
//         burnMsolFrom: burnMsolFrom.address,
//         burnMsolAuthority: stakeAuthority.publicKey,
//         treasuryMsolAccount: treasuryMsolAccount.address,
//         validatorList: validatorList.publicKey,
//         stakeList: stakeList.publicKey,
//         stakeWithdrawAuthority: stakeWithdrawAuthority,
//         stakeDepositAuthority: stakeDepositAuthority,
//         stakeAccount: stakeAccount.publicKey,
//         splitStakeAccount: newsplitStakeAccount.publicKey,
//         splitStakeRentPayer: stakeAuthority.publicKey,
//         stakeProgram: StakeProgram.programId,
//       })
//       .signers([stakeAuthority])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, validatorList, stakeList, stakeAccount, newsplitStakeAccount, stakeAuthority]);
//     console.log("Transaction Signature:", sig);
//   })


//   //  ** Missing Part
//   it("realloc_validator_list", async () => {
//     const tx = await program.methods.reallocValidatorList(10)
//       .accounts({
//         state: stateAccount.publicKey,
//         adminAuthority: authorityAcc.publicKey,
//         validatorList: validatorList.publicKey,
//         rentFunds: payer.publicKey,
//       })
//       .signers([authorityAcc , payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, authorityAcc, validatorList]);
//     console.log("Transaction Signature:", sig);
//   })

//   //  ** Missing Part
//   it("realloc_stake_list", async () => {
//     const tx = await program.methods.reallocStakeList(10)
//       .accounts({
//         state: stateAccount.publicKey,
//         adminAuthority: authorityAcc.publicKey,
//         stakeList: stakeList.publicKey,
//         rentFunds: payer.publicKey,
//       })
//       .signers([authorityAcc , payer])
//       .transaction()
//     // Set fee payer and recent blockhash
//     tx.feePayer = payer.publicKey;
//     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//     // Simulate the transaction to catch errors
//     const simulationResult = await connection.simulateTransaction(tx);
//     console.log("Simulation Result:", simulationResult);
//     // Send the transaction
//     const sig = await sendAndConfirmTransaction(connection, tx, [payer, stateAccount, authorityAcc, stakeList]);
//     console.log("Transaction Signature:", sig);
//   })



// });
