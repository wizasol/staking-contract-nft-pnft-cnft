use crate::errors::ErrorCode;
use crate::increment_total_stake_seconds;
use crate::StakeEntry;
use crate::StakePool;
use crate::BASIS_POINTS_DIVISOR;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct IncrementStakeEntryMultiplierStakeSecondsCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<IncrementStakeEntryMultiplierStakeSecondsCtx>, multiplier_stake_seconds: u128) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    if stake_entry.multiplier_basis_points.is_none() {
        stake_entry.multiplier_basis_points = Some(BASIS_POINTS_DIVISOR);
    }
    increment_total_stake_seconds(stake_entry)?;
    stake_entry.multiplier_stake_seconds = Some(
        stake_entry
            .multiplier_stake_seconds
            .expect("No multiplier stake seconds found")
            .checked_add(multiplier_stake_seconds)
            .expect("Error decrementing"),
    );
    Ok(())
}
