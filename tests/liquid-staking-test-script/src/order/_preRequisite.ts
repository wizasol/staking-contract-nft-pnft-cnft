import { connection, payer } from "../config"
import { preRequisite } from "../instructions"

export const _preRequisite = async () => {
    const {
        stateAccount,
        stakeList,
        validatorList,
        operationalSolAccount,
        authorityAcc,
        stakeAuthority,
        stakeAccount,
        authorityMsolAcc,
        authorityLpAcc,
        reservePda,
        solLegPda,
        authorityMSolLegAcc,
        stakeDepositAuthority,
        stakeWithdrawAuthority,
        msolMint,
        lpMint,
        treasuryMsolAccount,
        mSolLeg,
        mint_to,
        burnMsolFrom,
    } = await preRequisite(connection, payer)
}
