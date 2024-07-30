use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::reward_distribution::RewardDistributor;
use crate::reward_distribution::REWARD_DISTRIBUTOR_SEED;
use crate::reward_distribution::REWARD_DISTRIBUTOR_SIZE;
use crate::Action;
use crate::StakePool;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitRewardDistributorIx {
    reward_amount: u64,
    reward_duration_seconds: u128,
    identifier: u64,
    supply: Option<u64>,
    default_multiplier: Option<u64>,
    multiplier_decimals: Option<u8>,
    max_reward_seconds_received: Option<u128>,
    claim_rewards_payment_info: Pubkey,
}

#[derive(Accounts)]
#[instruction(ix: InitRewardDistributorIx)]
pub struct InitRewardDistributorCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = REWARD_DISTRIBUTOR_SIZE,
        seeds = [REWARD_DISTRIBUTOR_SEED.as_bytes(), stake_pool.key().as_ref(), ix.identifier.to_le_bytes().as_ref()],
        bump,
    )]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(constraint = authority.key() == stake_pool.authority.key() @ ErrorCode::InvalidAuthority)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut)]
    reward_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitRewardDistributorCtx>, ix: InitRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.bump = *ctx.bumps.get("reward_distributor").unwrap();
    reward_distributor.authority = ctx.accounts.authority.key();
    reward_distributor.identifier = ix.identifier;
    reward_distributor.stake_pool = ctx.accounts.stake_pool.key();
    reward_distributor.reward_mint = ctx.accounts.reward_mint.key();
    reward_distributor.reward_amount = ix.reward_amount;
    reward_distributor.reward_duration_seconds = ix.reward_duration_seconds as u128;
    reward_distributor.default_multiplier = ix.default_multiplier.unwrap_or(1);
    reward_distributor.multiplier_decimals = ix.multiplier_decimals.unwrap_or(0);
    reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    reward_distributor.claim_rewards_payment_info = ix.claim_rewards_payment_info;

    assert_payment_info(ctx.accounts.stake_pool.key(), Action::ClaimRewards, ix.claim_rewards_payment_info)?;
    Ok(())
}
