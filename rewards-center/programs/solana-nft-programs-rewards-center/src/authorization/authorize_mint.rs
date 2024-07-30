use super::StakeAuthorizationRecord;
use super::STAKE_AUTHORIZATION_SEED;
use super::STAKE_AUTHORIZATION_SIZE;
use crate::errors::ErrorCode;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct AuthorizeMintCtx<'info> {
    #[account(mut)]
    stake_pool: Account<'info, StakePool>,
    #[account(
        init,
        payer = payer,
        space = STAKE_AUTHORIZATION_SIZE,
        seeds = [STAKE_AUTHORIZATION_SEED.as_bytes(), stake_pool.key().as_ref(), mint.as_ref()],
        bump
    )]
    stake_authorization_record: Account<'info, StakeAuthorizationRecord>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AuthorizeMintCtx>, mint: Pubkey) -> Result<()> {
    let stake_authorization_record = &mut ctx.accounts.stake_authorization_record;
    stake_authorization_record.bump = *ctx.bumps.get("stake_authorization_record").unwrap();
    stake_authorization_record.pool = ctx.accounts.stake_pool.key();
    stake_authorization_record.mint = mint;

    Ok(())
}
