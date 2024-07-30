use crate::utils::resize_account;
use crate::{stake_entry_fill_zeros, StakeEntry, STAKE_ENTRY_SIZE};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResizeStakeEntryCtx<'info> {
    #[account(mut)]
    stake_entry: Account<'info, StakeEntry>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResizeStakeEntryCtx>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry_fill_zeros(stake_entry)?;
    resize_account(
        &ctx.accounts.stake_entry.to_account_info(),
        STAKE_ENTRY_SIZE,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
