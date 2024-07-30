use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // validations
    #[msg("Invalid stake pool")]
    InvalidStakePool = 0,
    #[msg("Invalid stake entry")]
    InvalidStakeEntry,
    #[msg("Invalid stake pool authority")]
    InvalidAuthority,
    #[msg("Mismatched user and escrow")]
    InvalidEscrow,

    // actions
    #[msg("Invalid user original mint token account")]
    InvalidUserStakeMintTokenAccount = 10,
    #[msg("Invalid last staker")]
    InvalidLastStaker,
    #[msg("Cannot update unstaked entry")]
    CannotUpdateUnstakedEntry,
    #[msg("Cannot close staked entry")]
    CannotCloseStakedEntry,
    #[msg("Cannot close staked entry")]
    CannotClosePoolWithStakedEntries,

    // authorization errors
    #[msg("Invalid mint metadata")]
    InvalidMintMetadata = 20,
    #[msg("Mint not allowed in this pool")]
    MintNotAllowedInPool,
    #[msg("Invalid stake authorization provided")]
    InvalidStakeAuthorizationRecord,
    #[msg("Mint metadata is owned by the incorrect program")]
    InvalidMintMetadataOwner,

    // payment errors
    #[msg("Invalid payment mint")]
    InvalidPaymentMint = 30,
    #[msg("Invalid payment shares")]
    InvalidPaymentShares,
    #[msg("Invalid payment share")]
    InvalidPaymentShare,
    #[msg("Invalid payment token account")]
    InvalidPaymentTokenAccount,
    #[msg("Invalid payer token account")]
    InvalidPayerTokenAccount,
    #[msg("Invalid transfer program")]
    InvalidTransferProgram,

    // cooldown errors
    #[msg("Token still has some cooldown seconds remaining")]
    CooldownSecondRemaining = 40,

    // stake_pool errors
    #[msg("Stake pool has ended")]
    StakePoolHasEnded = 50,
    #[msg("Minimum stake seconds not satisfied")]
    MinStakeSecondsNotSatisfied,

    // boost errors
    #[msg("Cannot boost unstaked token")]
    CannotBoostUnstakedToken = 60,
    #[msg("Cannot boost past current time less than start time")]
    CannotBoostMoreThanCurrentTime,
    #[msg("Invalid boost payer token account")]
    InvalidBoostPayerTokenAccount,
    #[msg("Invalid boost payment recipient token account")]
    InvalidBoostPaymentRecipientTokenAccount,
    #[msg("Invalid payment info")]
    InvalidPaymentInfo,
    #[msg("Cannot boost a fungible token stake entry")]
    CannotBoostFungibleToken,

    // reward_receipt errors
    #[msg("Max number of receipts exceeded")]
    MaxNumberOfReceiptsExceeded = 70,
    #[msg("Invalid claimer")]
    InvalidClaimer,
    #[msg("Reward seconds not satisifed")]
    RewardSecondsNotSatisfied,
    #[msg("Invalid payer token account")]
    InvalidPayerTokenAcount,
    #[msg("Invalid max claimed receipts")]
    InvalidMaxClaimedReceipts,
    #[msg("Invalid reward receipt")]
    InvalidRewardReceipt,
    #[msg("Invalid receipt entry")]
    InvalidReceiptEntry,
    #[msg("Insufficient available stake seconds to use")]
    InsufficientAvailableStakeSeconds,
    #[msg("Invalid receipt manager")]
    InvalidReceiptManager,
    #[msg("Reward receipt is not allowed")]
    RewardReceiptIsNotAllowed,
    #[msg("Reward receipt already claimed")]
    RewardReceiptAlreadyClaimed,

    // reward_distribution errors
    #[msg("Invalid token account")]
    InvalidTokenAccount = 90,
    #[msg("Invalid reward mint")]
    InvalidRewardMint,
    #[msg("Invalid user reward mint token account")]
    InvalidUserRewardMintTokenAccount,
    #[msg("Invalid reward distributor")]
    InvalidRewardDistributor,
    #[msg("Invalid reward distributor authority")]
    InvalidRewardDistributorAuthority,
    #[msg("Invalid reward distributor kind")]
    InvalidRewardDistributorKind,
    #[msg("Initial supply required for kind treasury")]
    SupplyRequired,
    #[msg("Invalid distributor for pool")]
    InvalidPoolDistributor,
    #[msg("Distributor is already open")]
    DistributorNotClosed,
    #[msg("Distributor is already closed")]
    DistributorAlreadyClosed,
    #[msg("Invalid reward entry")]
    InvalidRewardEntry,
    #[msg("Invalid reward distributor token account")]
    InvalidRewardDistributorTokenAccount,
    #[msg("Invalid authority token account")]
    InvalidAuthorityTokenAccount,
    #[msg("Max reward seconds claimed")]
    MaxRewardSecondsClaimed,
}
