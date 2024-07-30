use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::handle_payment_info;
use crate::reward_distribution::RewardDistributor;
use crate::reward_distribution::RewardEntry;
use crate::reward_distribution::REWARD_DISTRIBUTOR_SEED;
use crate::Action;
use crate::StakeEntry;
use crate::StakePool;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};
use std::cmp::min;

#[derive(Accounts)]
pub struct ClaimRewardsCtx<'info> {
    #[account(mut)]
    reward_entry: Box<Account<'info, RewardEntry>>,
    #[account(mut, constraint = reward_distributor.stake_pool == stake_pool.key())]
    reward_distributor: Box<Account<'info, RewardDistributor>>,

    #[account(constraint = stake_entry.key() == reward_entry.stake_entry @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(constraint = stake_pool.key() == stake_entry.pool)]
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut, constraint = reward_mint.key() == reward_distributor.reward_mint @ ErrorCode::InvalidRewardMint)]
    reward_mint: Box<Account<'info, Mint>>,
    #[account(mut, constraint = user_reward_mint_token_account.owner == stake_entry.last_staker &&  user_reward_mint_token_account.mint == reward_distributor.reward_mint @ ErrorCode::InvalidUserRewardMintTokenAccount)]
    user_reward_mint_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = reward_distributor_token_account.mint == reward_mint.key() && reward_distributor_token_account.owner == reward_distributor.key() @ ErrorCode::InvalidTokenAccount)]
    reward_distributor_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = user.key() == stake_entry.last_staker || user.key() == reward_distributor.authority @ ErrorCode::InvalidAuthority)]
    user: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRewardsCtx>) -> Result<()> {
    let reward_entry = &mut ctx.accounts.reward_entry;
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    let stake_pool = reward_distributor.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;
    let identifier_seed = reward_distributor.identifier.to_le_bytes();
    let reward_distributor_seed = &[REWARD_DISTRIBUTOR_SEED.as_bytes(), stake_pool.as_ref(), identifier_seed.as_ref(), &[reward_distributor.bump]];
    let reward_distributor_signer = &[&reward_distributor_seed[..]];

    let reward_amount = reward_distributor.reward_amount;
    let reward_duration_seconds = reward_distributor.reward_duration_seconds;

    let reward_seconds_received = reward_entry.reward_seconds_received;
    if reward_seconds_received <= stake_entry.total_stake_seconds {
        let mut reward_seconds = stake_entry.total_stake_seconds;
        if let Some(max_reward_seconds) = reward_distributor.max_reward_seconds_received {
            reward_seconds = min(reward_seconds, max_reward_seconds)
        };
        if reward_seconds_received >= reward_seconds {
            msg!("Max reward seconds claimed");
            return Ok(());
        }

        let mut reward_amount_to_receive = reward_seconds
            .checked_sub(reward_seconds_received)
            .unwrap()
            .checked_div(reward_duration_seconds)
            .unwrap()
            .checked_mul(reward_amount as u128)
            .unwrap()
            .checked_mul(reward_entry.multiplier as u128)
            .unwrap()
            .checked_div((10_u128).checked_pow(reward_distributor.multiplier_decimals as u32).unwrap())
            .unwrap();

        // mint to the user
        if reward_amount_to_receive > ctx.accounts.reward_distributor_token_account.amount as u128 {
            reward_amount_to_receive = ctx.accounts.reward_distributor_token_account.amount as u128;
        }
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.reward_distributor_token_account.to_account_info(),
            to: ctx.accounts.user_reward_mint_token_account.to_account_info(),
            authority: reward_distributor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
        // todo this could be an issue and get stuck, might need 2 transfers
        token::transfer(cpi_context, reward_amount_to_receive.try_into().expect("Too many rewards to receive"))?;

        // update values
        // this is nuanced about if the rewards are closed, should they get the reward time for that time even though they didnt get any rewards?
        // this only matters if the reward distributor becomes open again and they missed out on some rewards they coudlve gotten
        let reward_time_to_receive = if reward_entry.multiplier != 0 {
            reward_amount_to_receive
                .checked_mul((10_u128).checked_pow(reward_distributor.multiplier_decimals as u32).unwrap())
                .unwrap()
                .checked_div(reward_entry.multiplier as u128)
                .unwrap()
                .checked_div(reward_amount as u128)
                .unwrap()
                .checked_mul(reward_duration_seconds)
                .unwrap()
        } else {
            0_u128
        };

        reward_distributor.rewards_issued = reward_distributor.rewards_issued.checked_add(reward_amount_to_receive).unwrap();
        reward_entry.reward_seconds_received = reward_entry.reward_seconds_received.checked_add(reward_time_to_receive).unwrap();

        // handle payment
        let remaining_accounts = &mut ctx.remaining_accounts.iter();
        assert_payment_info(stake_pool.key(), Action::ClaimRewards, reward_distributor.claim_rewards_payment_info)?;
        handle_payment_info(reward_distributor.claim_rewards_payment_info, remaining_accounts)?;
    }

    Ok(())
}
