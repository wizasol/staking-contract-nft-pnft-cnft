use crate::errors::ErrorCode;
use crate::reward_distribution::RewardDistributor;
use crate::reward_distribution::REWARD_DISTRIBUTOR_SEED;
use crate::StakePool;
use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};

#[derive(Accounts)]
pub struct CloseRewardDistributorCtx<'info> {
    #[account(mut, constraint = reward_distributor.stake_pool == stake_pool.key())]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut, constraint = reward_mint.key() == reward_distributor.reward_mint @ ErrorCode::InvalidRewardMint)]
    reward_mint: Box<Account<'info, Mint>>,
    #[account(mut, constraint = reward_distributor_token_account.mint == reward_mint.key() && reward_distributor_token_account.owner == reward_distributor.key() @ ErrorCode::InvalidTokenAccount)]
    reward_distributor_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = authority_token_account.mint == reward_mint.key() && authority_token_account.owner == signer.key() @ ErrorCode::InvalidTokenAccount)]
    authority_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = signer.key() == stake_pool.authority @ErrorCode::InvalidAuthority)]
    signer: Signer<'info>,
    token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CloseRewardDistributorCtx>) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    let identifier_seed = reward_distributor.identifier.to_le_bytes();
    let reward_distributor_seed = &[
        REWARD_DISTRIBUTOR_SEED.as_bytes(),
        reward_distributor.stake_pool.as_ref(),
        identifier_seed.as_ref(),
        &[reward_distributor.bump],
    ];
    let reward_distributor_signer = &[&reward_distributor_seed[..]];

    let cpi_accounts = token::Transfer {
        from: ctx.accounts.reward_distributor_token_account.to_account_info(),
        to: ctx.accounts.authority_token_account.to_account_info(),
        authority: reward_distributor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
    token::transfer(cpi_context, ctx.accounts.reward_distributor_token_account.amount)?;

    let cpi_accounts = token::CloseAccount {
        account: ctx.accounts.reward_distributor_token_account.to_account_info(),
        destination: ctx.accounts.authority_token_account.to_account_info(),
        authority: reward_distributor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
    token::close_account(cpi_context)?;

    ctx.accounts.reward_distributor.close(ctx.accounts.signer.to_account_info())?;
    Ok(())
}
