use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::reward_distribution::RewardDistributor;
use crate::Action;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRewardDistributorIx {
    pub default_multiplier: u64,
    pub multiplier_decimals: u8,
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub max_reward_seconds_received: Option<u128>,
    pub claim_rewards_payment_info: Pubkey,
}

#[derive(Accounts)]
#[instruction(ix: UpdateRewardDistributorIx)]
pub struct UpdateRewardDistributorCtx<'info> {
    #[account(mut)]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(constraint = authority.key() == reward_distributor.authority @ ErrorCode::InvalidRewardDistributorAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateRewardDistributorCtx>, ix: UpdateRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.default_multiplier = ix.default_multiplier;
    reward_distributor.multiplier_decimals = ix.multiplier_decimals;
    reward_distributor.reward_amount = ix.reward_amount;
    reward_distributor.reward_duration_seconds = ix.reward_duration_seconds;
    reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    reward_distributor.claim_rewards_payment_info = ix.claim_rewards_payment_info;

    assert_payment_info(reward_distributor.stake_pool, Action::ClaimRewards, ix.claim_rewards_payment_info)?;
    Ok(())
}
