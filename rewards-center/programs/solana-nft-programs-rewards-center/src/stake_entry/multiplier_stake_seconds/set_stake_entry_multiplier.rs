use crate::errors::ErrorCode;
use crate::stake_entry_fill_zeros;
use crate::StakeEntry;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetStakeEntryMultiplierCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetStakeEntryMultiplierCtx>, multiplier_basis_points: Option<u64>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry.multiplier_basis_points = multiplier_basis_points;
    stake_entry_fill_zeros(stake_entry)?;

    Ok(())
}
