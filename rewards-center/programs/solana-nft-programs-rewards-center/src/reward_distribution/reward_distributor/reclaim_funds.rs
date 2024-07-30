use crate::errors::ErrorCode;
use crate::reward_distribution::RewardDistributor;
use crate::reward_distribution::REWARD_DISTRIBUTOR_SEED;
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};

#[derive(Accounts)]
pub struct ReclaimFundsCtx<'info> {
    #[account(mut)]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(mut, constraint = reward_distributor_token_account.owner == reward_distributor.key() && reward_distributor_token_account.mint == reward_distributor.reward_mint @ ErrorCode::InvalidRewardDistributorTokenAccount)]
    reward_distributor_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = authority_token_account.owner == authority.key() && authority_token_account.mint == reward_distributor.reward_mint @ ErrorCode::InvalidAuthorityTokenAccount)]
    authority_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = authority.key() == reward_distributor.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ReclaimFundsCtx>, amount: u64) -> Result<()> {
    let identifier_seed = ctx.accounts.reward_distributor.identifier.to_le_bytes();
    let reward_distributor_seed = &[
        REWARD_DISTRIBUTOR_SEED.as_bytes(),
        ctx.accounts.reward_distributor.stake_pool.as_ref(),
        identifier_seed.as_ref(),
        &[ctx.accounts.reward_distributor.bump],
    ];
    let reward_distributor_signer = &[&reward_distributor_seed[..]];
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.reward_distributor_token_account.to_account_info(),
        to: ctx.accounts.authority_token_account.to_account_info(),
        authority: ctx.accounts.reward_distributor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
    token::transfer(cpi_context, amount)?;
    Ok(())
}
