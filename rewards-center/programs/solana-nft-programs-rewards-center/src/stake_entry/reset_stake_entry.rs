use crate::errors::ErrorCode;
use crate::stake_entry_fill_zeros;
use crate::StakeEntry;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResetStakeEntryCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<ResetStakeEntryCtx>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry.total_stake_seconds = 0;
    stake_entry.used_stake_seconds = 0;
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.last_staked_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.cooldown_start_seconds = None;
    stake_entry.multiplier_stake_seconds = None;
    stake_entry_fill_zeros(stake_entry)?;

    Ok(())
}
