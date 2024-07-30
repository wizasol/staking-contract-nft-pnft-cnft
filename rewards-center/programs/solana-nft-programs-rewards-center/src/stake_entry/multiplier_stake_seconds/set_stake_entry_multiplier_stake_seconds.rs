use crate::errors::ErrorCode;
use crate::stake_entry_fill_zeros;
use crate::StakeEntry;
use crate::StakePool;
use crate::BASIS_POINTS_DIVISOR;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetStakeEntryMultiplierStakeSecondsCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetStakeEntryMultiplierStakeSecondsCtx>, multiplier_stake_seconds: Option<u128>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    if stake_entry.multiplier_basis_points.is_none() {
        stake_entry.multiplier_basis_points = Some(BASIS_POINTS_DIVISOR);
    }
    stake_entry.multiplier_stake_seconds = multiplier_stake_seconds;
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    stake_entry_fill_zeros(stake_entry)?;

    Ok(())
}
