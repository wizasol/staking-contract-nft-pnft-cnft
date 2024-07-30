pub mod stake_pool;
pub use stake_pool::*;
pub mod stake_entry;
pub use stake_entry::*;
pub mod authorization;
pub use authorization::*;
pub mod reward_distribution;
pub use reward_distribution::*;
pub mod stake_booster;
pub use stake_booster::*;
pub mod reward_receipts;
pub use reward_receipts::*;
pub mod payment;
pub use payment::*;

pub mod errors;
pub mod utils;

use anchor_lang::prelude::*;

declare_id!("EnUpcqfqHozLZdojn2595cLSZkUqgPCDujSonJvP27HP");

#[program]
pub mod solana_nft_programs_rewards_center {

    use super::*;

    //// stake_pool ////
    pub fn init_pool(ctx: Context<InitPoolCtx>, ix: InitPoolIx) -> Result<()> {
        stake_pool::init_pool::handler(ctx, ix)
    }
    pub fn update_pool(ctx: Context<UpdatePoolCtx>, ix: UpdatePoolIx) -> Result<()> {
        stake_pool::update_pool::handler(ctx, ix)
    }
    pub fn close_stake_pool(ctx: Context<CloseStakePoolCtx>) -> Result<()> {
        stake_pool::close_stake_pool::handler(ctx)
    }

    //// stake_entry ////
    pub fn init_entry(ctx: Context<InitEntryCtx>, user: Pubkey) -> Result<()> {
        stake_entry::init_entry::handler(ctx, user)
    }
    pub fn update_total_stake_seconds(ctx: Context<UpdateTotalStakeSecondsCtx>) -> Result<()> {
        stake_entry::update_total_stake_seconds::handler(ctx)
    }
    pub fn reset_stake_entry(ctx: Context<ResetStakeEntryCtx>) -> Result<()> {
        stake_entry::reset_stake_entry::handler(ctx)
    }
    pub fn set_stake_entry_multiplier(ctx: Context<SetStakeEntryMultiplierCtx>, multiplier_basis_points: Option<u64>) -> Result<()> {
        stake_entry::multiplier_stake_seconds::set_stake_entry_multiplier::handler(ctx, multiplier_basis_points)
    }
    pub fn set_stake_entry_multiplier_stake_seconds(ctx: Context<SetStakeEntryMultiplierStakeSecondsCtx>, multiplier_stake_seconds: Option<u128>) -> Result<()> {
        stake_entry::multiplier_stake_seconds::set_stake_entry_multiplier_stake_seconds::handler(ctx, multiplier_stake_seconds)
    }
    pub fn increment_stake_entry_multiplier_stake_seconds(ctx: Context<IncrementStakeEntryMultiplierStakeSecondsCtx>, multiplier_stake_seconds: u128) -> Result<()> {
        stake_entry::multiplier_stake_seconds::increment_stake_entry_multiplier_stake_seconds::handler(ctx, multiplier_stake_seconds)
    }
    pub fn decrement_stake_entry_multiplier_stake_seconds(ctx: Context<DecrementStakeEntryMultiplierStakeSecondsCtx>, multiplier_stake_seconds: u128) -> Result<()> {
        stake_entry::multiplier_stake_seconds::decrement_stake_entry_multiplier_stake_seconds::handler(ctx, multiplier_stake_seconds)
    }
    pub fn resize_stake_entry(ctx: Context<ResizeStakeEntryCtx>) -> Result<()> {
        stake_entry::resize_stake_entry::handler(ctx)
    }
    pub fn close_stake_entry(ctx: Context<CloseStakeEntryCtx>) -> Result<()> {
        stake_entry::close_stake_entry::handler(ctx)
    }
    //// stake_entry::editions ////
    pub fn stake_edition<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeEditionCtx<'info>>, amount: u64) -> Result<()> {
        stake_entry::editions::stake_edition::handler(ctx, amount)
    }
    pub fn unstake_edition<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, UnstakeEditionCtx<'info>>) -> Result<()> {
        stake_entry::editions::unstake_edition::handler(ctx)
    }
    //// stake_entry::ccs ////
    pub fn stake_ccs<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeCCSCtx<'info>>, amount: u64) -> Result<()> {
        stake_entry::ccs::stake_ccs::handler(ctx, amount)
    }
    pub fn unstake_ccs<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, UnstakeCCSCtx<'info>>) -> Result<()> {
        stake_entry::ccs::unstake_ccs::handler(ctx)
    }
    pub fn stake_pnft(ctx: Context<StakePNFTCtx>) -> Result<()> {
        stake_entry::pnfts::stake_pnft::handler(ctx)
    }

    pub fn unstake_pnft(ctx: Context<UnstakePNFTCtx>) -> Result<()> {
        stake_entry::pnfts::unstake_pnft::handler(ctx)
    }

    //// authorization ////
    pub fn authorize_mint(ctx: Context<AuthorizeMintCtx>, mint: Pubkey) -> Result<()> {
        authorization::authorize_mint::handler(ctx, mint)
    }
    pub fn deauthorize_mint(ctx: Context<DeauthorizeMintCtx>) -> Result<()> {
        authorization::deauthorize_mint::handler(ctx)
    }

    //// stake_booster ////
    pub fn init_stake_booster(ctx: Context<InitStakeBoosterCtx>, ix: InitStakeBoosterIx) -> Result<()> {
        stake_booster::init_stake_booster::handler(ctx, ix)
    }
    pub fn update_stake_booster(ctx: Context<UpdateStakeBoosterCtx>, ix: UpdateStakeBoosterIx) -> Result<()> {
        stake_booster::update_stake_booster::handler(ctx, ix)
    }
    pub fn boost_stake_entry(ctx: Context<BoostStakeEntryCtx>, ix: BoostStakeEntryIx) -> Result<()> {
        stake_booster::boost_stake_entry::handler(ctx, ix)
    }
    pub fn close_stake_booster(ctx: Context<CloseStakeBoosterCtx>) -> Result<()> {
        stake_booster::close_stake_booster::handler(ctx)
    }

    //// reward_receipts ////
    //// reward_receipts::receipt_manager ////
    pub fn init_receipt_manager(ctx: Context<InitReceiptManagerCtx>, ix: InitReceiptManagerIx) -> Result<()> {
        reward_receipts::receipt_manager::init_receipt_manager::handler(ctx, ix)
    }
    pub fn update_receipt_manager(ctx: Context<UpdateReceiptManagerCtx>, ix: UpdateReceiptManagerIx) -> Result<()> {
        reward_receipts::receipt_manager::update_receipt_manager::handler(ctx, ix)
    }
    pub fn close_receipt_manager(ctx: Context<CloseReceiptManagerCtx>) -> Result<()> {
        reward_receipts::receipt_manager::close_receipt_manager::handler(ctx)
    }

    //// reward_receipts::reward_receipt ////
    pub fn init_reward_receipt(ctx: Context<InitRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::init_reward_receipt::handler(ctx)
    }
    pub fn close_reward_receipt(ctx: Context<CloseRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::close_reward_receipt::handler(ctx)
    }
    pub fn claim_reward_receipt(ctx: Context<ClaimRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::claim_reward_receipt::handler(ctx)
    }
    pub fn set_reward_receipt_allowed(ctx: Context<SetRewardReceiptAllowedCtx>, allowed: bool) -> Result<()> {
        reward_receipts::reward_receipt::set_reward_receipt_allowed::handler(ctx, allowed)
    }

    //// reward_distribution ////
    //// reward_distribution::reward_distributor ////
    pub fn init_reward_distributor(ctx: Context<InitRewardDistributorCtx>, ix: InitRewardDistributorIx) -> Result<()> {
        reward_distribution::reward_distributor::init_reward_distributor::handler(ctx, ix)
    }
    pub fn update_reward_distributor(ctx: Context<UpdateRewardDistributorCtx>, ix: UpdateRewardDistributorIx) -> Result<()> {
        reward_distribution::reward_distributor::update_reward_distributor::handler(ctx, ix)
    }
    pub fn close_reward_distributor(ctx: Context<CloseRewardDistributorCtx>) -> Result<()> {
        reward_distribution::reward_distributor::close_reward_distributor::handler(ctx)
    }
    pub fn reclaim_funds(ctx: Context<ReclaimFundsCtx>, amount: u64) -> Result<()> {
        reward_distribution::reward_distributor::reclaim_funds::handler(ctx, amount)
    }

    //// reward_distribution::reward_entry ////
    pub fn init_reward_entry(ctx: Context<InitRewardEntryCtx>) -> Result<()> {
        reward_distribution::reward_entry::init_reward_entry::handler(ctx)
    }
    pub fn close_reward_entry(ctx: Context<CloseRewardEntryCtx>) -> Result<()> {
        reward_distribution::reward_entry::close_reward_entry::handler(ctx)
    }
    pub fn update_reward_entry(ctx: Context<UpdateRewardEntryCtx>, ix: UpdateRewardEntryIx) -> Result<()> {
        reward_distribution::reward_entry::update_reward_entry::handler(ctx, ix)
    }
    pub fn claim_rewards(ctx: Context<ClaimRewardsCtx>) -> Result<()> {
        reward_distribution::reward_entry::claim_rewards::handler(ctx)
    }

    //// payment ////
    pub fn init_payment_info(ctx: Context<InitPaymentInfoCtx>, ix: InitPaymentInfoIx) -> Result<()> {
        payment::init_payment_info::handler(ctx, ix)
    }
    pub fn update_payment_info(ctx: Context<UpdatePaymentInfoCtx>, ix: UpdatePaymentInfoIx) -> Result<()> {
        payment::update_payment_info::handler(ctx, ix)
    }
    pub fn close_payment_info(ctx: Context<ClosePaymentInfoCtx>) -> Result<()> {
        payment::close_payment_info::handler(ctx)
    }
}
