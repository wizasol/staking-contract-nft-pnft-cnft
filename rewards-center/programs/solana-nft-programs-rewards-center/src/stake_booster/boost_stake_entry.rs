use super::StakeBooster;
use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::handle_payment;
use crate::handle_payment_info;
use crate::Action;
use crate::StakeEntry;
use crate::StakePool;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BoostStakeEntryIx {
    seconds_to_boost: u64,
}

#[derive(Accounts)]
pub struct BoostStakeEntryCtx<'info> {
    #[account(mut)]
    stake_booster: Box<Account<'info, StakeBooster>>,
    #[account(mut, constraint = stake_booster.stake_pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(constraint = stake_entry.stake_mint == stake_mint.key() @ ErrorCode::InvalidStakePool)]
    stake_mint: Box<Account<'info, Mint>>,
}

pub fn handler(ctx: Context<BoostStakeEntryCtx>, ix: BoostStakeEntryIx) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    if stake_entry.last_staker == Pubkey::default() || stake_entry.amount == 0 {
        return Err(error!(ErrorCode::CannotBoostUnstakedToken));
    }

    if ctx.accounts.stake_mint.supply > 1 || stake_entry.amount > 1 {
        return Err(error!(ErrorCode::CannotBoostFungibleToken));
    }

    stake_entry.total_stake_seconds = stake_entry.total_stake_seconds.saturating_add(u128::try_from(ix.seconds_to_boost).expect("Number conversion error"));

    if stake_entry
        .total_stake_seconds
        .gt(&u128::try_from(Clock::get().unwrap().unix_timestamp.checked_sub(ctx.accounts.stake_booster.start_time_seconds).expect("Sub error")).expect("Number conversion error"))
    {
        return Err(error!(ErrorCode::CannotBoostMoreThanCurrentTime));
    }

    let boost_payment_amount = ix
        .seconds_to_boost
        .checked_mul(ctx.accounts.stake_booster.payment_amount)
        .expect("Multiplication error")
        .checked_div(u64::try_from(ctx.accounts.stake_booster.boost_seconds).expect("Number conversion error"))
        .expect("Division error");

    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    // handle payment
    handle_payment(
        boost_payment_amount,
        ctx.accounts.stake_booster.payment_mint,
        &ctx.accounts.stake_booster.payment_shares,
        remaining_accounts,
    )?;

    // handle action payment
    assert_payment_info(
        ctx.accounts.stake_booster.stake_pool.key(),
        Action::BoostStakeEntry,
        ctx.accounts.stake_booster.boost_action_payment_info,
    )?;
    handle_payment_info(ctx.accounts.stake_booster.boost_action_payment_info, remaining_accounts)?;
    Ok(())
}
