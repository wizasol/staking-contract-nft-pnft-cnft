import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';

/**
 * Create and initialize a new associated token account
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param mint                     Mint for the account
 * @param owner                    Owner of the new account
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 *
 * @return Address of the new associated token account
 */
export async function createAtaTx(
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    owner: PublicKey,
    confirmOptions?: ConfirmOptions,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
    allowOwnerOffCurve = false,
): Promise<Transaction> {
    const associatedToken = getAssociatedTokenAddressSync(
        mint,
        owner,
        allowOwnerOffCurve,
        programId,
        associatedTokenProgramId,
    );

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedToken,
            owner,
            mint,
            programId,
            associatedTokenProgramId,
        ),
    );

    return transaction;
}
