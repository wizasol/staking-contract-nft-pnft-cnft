import { Connection, PublicKey } from "@solana/web3.js"
import { sleep } from "."
import { getParsedStakeAccountInfo } from "./getParsedStakeAccountInfo"

export async function waitForStakeAccountActivation({
    stakeAccount,
    connection,
    timeoutSeconds = 30,
    activatedAtLeastFor = 0,
}: {
    stakeAccount: PublicKey
    connection: Connection
    timeoutSeconds?: number
    activatedAtLeastFor?: number
}) {
    // 1. waiting for the stake account to be activated
    {
        const startTime = Date.now()
        let stakeStatus = await connection.getStakeActivation(stakeAccount)
        while (stakeStatus.state !== 'active') {
            await sleep(1000)
            stakeStatus = await connection.getStakeActivation(stakeAccount)
            if (Date.now() - startTime > timeoutSeconds * 1000) {
                throw new Error(
                    `Stake account ${stakeAccount.toBase58()} was not activated in timeout of ${timeoutSeconds} seconds`
                )
            }
        }
    }

    // 2. the stake account is active, but it needs to be active for at least waitForEpochs epochs
    if (activatedAtLeastFor > 0) {
        const stakeAccountData = await getParsedStakeAccountInfo(
            connection,
            stakeAccount
        )
        const stakeAccountActivationEpoch = stakeAccountData.activationEpoch
        if (stakeAccountActivationEpoch === null) {
            throw new Error(
                'Expected stake account to be already activated. Unexpected setup error stake account:' +
                stakeAccountData
            )
        }

        const startTime = Date.now()
        let currentEpoch = (await connection.getEpochInfo()).epoch
        if (
            currentEpoch <
            stakeAccountActivationEpoch.toNumber() + activatedAtLeastFor
        ) {
            console.debug(
                `Waiting for the stake account ${stakeAccount.toBase58()} to be active at least for ${activatedAtLeastFor} epochs ` +
                `currently active for ${currentEpoch - stakeAccountActivationEpoch.toNumber()
                } epoch(s)`
            )
        }
        while (
            currentEpoch <
            stakeAccountActivationEpoch.toNumber() + activatedAtLeastFor
        ) {
            if (Date.now() - startTime > timeoutSeconds * 1000) {
                throw new Error(
                    `Stake account ${stakeAccount.toBase58()} was activated but timeout ${timeoutSeconds} elapsed when waiting ` +
                    `for ${activatedAtLeastFor} epochs the account to be activated, it's activated only for ` +
                    `${currentEpoch - stakeAccountActivationEpoch.toNumber()
                    } epochs at this time`
                )
            }
            await sleep(1000)
            currentEpoch = (await connection.getEpochInfo()).epoch
        }
    }
}
