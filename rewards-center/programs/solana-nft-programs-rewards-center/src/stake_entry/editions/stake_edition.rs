use crate::assert_payment_info;
use crate::authorization::mint_is_allowed;
use crate::errors::ErrorCode;
use crate::escrow_seeds;
use crate::handle_payment_info;
use crate::stake_entry::increment_total_stake_seconds;
use crate::stake_entry_fill_zeros;
use crate::stake_seed;
use crate::Action;
use crate::StakeEntry;
use crate::StakePool;
use crate::STAKE_ENTRY_PREFIX;
use anchor_lang::prelude::*;
use anchor_spl::token::Approve;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};
use solana_program::program::invoke_signed;

#[derive(Accounts)]
pub struct StakeEditionCtx<'info> {
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.stake_mint.as_ref(), stake_seed(stake_mint.supply, user.key()).as_ref()], bump = stake_entry.bump)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(constraint = stake_entry.stake_mint == stake_mint.key() @ ErrorCode::InvalidStakeEntry)]
    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in handler
    stake_mint_edition: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    stake_mint_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    user: Signer<'info>,
    /// CHECK: Checked in handler
    #[account(mut)]
    user_escrow: UncheckedAccount<'info>,
    #[account(mut, constraint =
        user_stake_mint_token_account.amount > 0
        && user_stake_mint_token_account.mint == stake_entry.stake_mint
        && user_stake_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserStakeMintTokenAccount
    )]
    user_stake_mint_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Address checked
    #[account(address = mpl_token_metadata::ID)]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeEditionCtx<'info>>, amount: u64) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;

    let user = ctx.accounts.user.key();
    let user_escrow = ctx.accounts.user_escrow.key();
    let user_escrow_seeds = escrow_seeds(&user, &user_escrow)?;

    //// FEATURE: Ended
    if stake_pool.end_date.is_some() && Clock::get().unwrap().unix_timestamp > stake_pool.end_date.unwrap() {
        return Err(error!(ErrorCode::StakePoolHasEnded));
    }

    //// FEATURE: Allowlist
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    mint_is_allowed(stake_pool, &ctx.accounts.stake_mint_metadata, ctx.accounts.stake_mint.key(), remaining_accounts)?;

    let cpi_accounts = Approve {
        to: ctx.accounts.user_stake_mint_token_account.to_account_info(),
        delegate: ctx.accounts.user_escrow.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::approve(cpi_context, amount)?;

    invoke_signed(
        &mpl_token_metadata::instructions::FreezeDelegatedAccount {
            delegate: user_escrow.key(),
            token_account: ctx.accounts.user_stake_mint_token_account.key(),
            edition: ctx.accounts.stake_mint_edition.key(),
            mint: ctx.accounts.stake_mint.key(),
            token_program: ctx.accounts.token_program.key(),
        }
        .instruction(),
        &[
            ctx.accounts.user_escrow.to_account_info(),
            ctx.accounts.user_stake_mint_token_account.to_account_info(),
            ctx.accounts.stake_mint_edition.to_account_info(),
            ctx.accounts.stake_mint.to_account_info(),
        ],
        &[&user_escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
    )?;

    // handle payment
    assert_payment_info(stake_pool.key(), Action::Stake, stake_pool.stake_payment_info)?;
    handle_payment_info(stake_pool.stake_payment_info, remaining_accounts)?;

    // update stake entry
    if stake_entry.amount != 0 {
        increment_total_stake_seconds(stake_entry)?;
        stake_entry.cooldown_start_seconds = None;
    }
    stake_entry.last_staker = ctx.accounts.user.key();
    stake_entry.last_staked_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.amount = stake_entry.amount.checked_add(amount).unwrap();
    stake_pool.total_staked = stake_pool.total_staked.checked_add(1).expect("Add error");
    stake_entry_fill_zeros(stake_entry)?;

    Ok(())
}
