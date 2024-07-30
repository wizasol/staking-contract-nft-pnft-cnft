use crate::authorization::mint_is_allowed;
use crate::stake_seed;
use crate::StakeEntry;
use crate::StakePool;
use crate::STAKE_ENTRY_PREFIX;
use crate::STAKE_ENTRY_SIZE;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct InitEntryCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_ENTRY_SIZE,
        seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_pool.key().as_ref(), stake_mint.key().as_ref(), stake_seed(stake_mint.supply, user).as_ref()],
        bump,
    )]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut)]
    stake_pool: Box<Account<'info, StakePool>>,

    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    stake_mint_metadata: AccountInfo<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitEntryCtx>, _user: Pubkey) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    let stake_pool = &ctx.accounts.stake_pool;
    stake_entry.bump = *ctx.bumps.get("stake_entry").unwrap();
    stake_entry.pool = ctx.accounts.stake_pool.key();
    stake_entry.stake_mint = ctx.accounts.stake_mint.key();
    stake_entry.amount = 0;

    // check allowlist
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    mint_is_allowed(stake_pool, &ctx.accounts.stake_mint_metadata, ctx.accounts.stake_mint.key(), remaining_accounts)?;

    Ok(())
}
