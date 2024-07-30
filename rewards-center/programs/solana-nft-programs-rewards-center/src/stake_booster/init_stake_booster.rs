use super::StakeBooster;
use super::STAKE_BOOSTER_PREFIX;
use super::STAKE_BOOSTER_SIZE;
use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::Action;
use crate::PaymentShare;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitStakeBoosterIx {
    stake_pool: Pubkey,
    identifier: u64,
    payment_amount: u64,
    payment_mint: Pubkey,
    payment_shares: Vec<PaymentShare>,
    boost_seconds: u128,
    start_time_seconds: i64,
    boost_action_payment_info: Pubkey,
}

#[derive(Accounts)]
#[instruction(ix: InitStakeBoosterIx)]
pub struct InitStakeBoosterCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_BOOSTER_SIZE,
        seeds = [STAKE_BOOSTER_PREFIX.as_bytes(), stake_pool.key().as_ref(), ix.identifier.to_le_bytes().as_ref()],
        bump,
    )]
    stake_booster: Box<Account<'info, StakeBooster>>,
    #[account(mut)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStakeBoosterCtx>, ix: InitStakeBoosterIx) -> Result<()> {
    let stake_booster = &mut ctx.accounts.stake_booster;
    assert_payment_info(stake_booster.stake_pool, Action::BoostStakeEntry, ix.boost_action_payment_info)?;

    stake_booster.bump = *ctx.bumps.get("stake_booster").unwrap();
    stake_booster.stake_pool = ctx.accounts.stake_pool.key();
    stake_booster.identifier = ix.identifier;
    stake_booster.payment_amount = ix.payment_amount;
    stake_booster.payment_mint = ix.payment_mint;
    stake_booster.payment_shares = ix.payment_shares;
    stake_booster.boost_seconds = ix.boost_seconds;
    stake_booster.start_time_seconds = ix.start_time_seconds;
    stake_booster.boost_action_payment_info = ix.boost_action_payment_info;

    Ok(())
}
