use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::handle_payment;
use crate::handle_payment_info;
use crate::reward_receipts::ReceiptManager;
use crate::reward_receipts::RewardReceipt;
use crate::Action;
use crate::StakeEntry;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimRewardReceiptCtx<'info> {
    #[account(mut, constraint = reward_receipt.receipt_manager == receipt_manager.key() && reward_receipt.stake_entry == stake_entry.key() @ ErrorCode::InvalidRewardReceipt)]
    reward_receipt: Box<Account<'info, RewardReceipt>>,
    #[account(mut)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(mut, constraint = stake_entry.pool == receipt_manager.stake_pool @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut, constraint = stake_entry.last_staker == claimer.key() @ ErrorCode::InvalidClaimer)]
    claimer: Signer<'info>,
}

pub fn handler(ctx: Context<ClaimRewardReceiptCtx>) -> Result<()> {
    let reward_receipt = &mut ctx.accounts.reward_receipt;

    if reward_receipt.target != Pubkey::default() {
        return Err(error!(ErrorCode::RewardReceiptAlreadyClaimed));
    }
    if ctx.accounts.receipt_manager.requires_authorization && !reward_receipt.allowed {
        return Err(error!(ErrorCode::RewardReceiptIsNotAllowed));
    }
    if ctx.accounts.stake_entry.total_stake_seconds < ctx.accounts.receipt_manager.required_stake_seconds {
        return Err(error!(ErrorCode::RewardSecondsNotSatisfied));
    }

    reward_receipt.target = ctx.accounts.claimer.key();
    ctx.accounts.receipt_manager.claimed_receipts_counter = ctx.accounts.receipt_manager.claimed_receipts_counter.checked_add(1).expect("Add error");

    let receipt_manager = &mut ctx.accounts.receipt_manager;
    if let Some(max_reward_receipts) = receipt_manager.max_claimed_receipts {
        if max_reward_receipts == receipt_manager.claimed_receipts_counter {
            return Err(error!(ErrorCode::MaxNumberOfReceiptsExceeded));
        }
    }

    // add to used seconds
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry.used_stake_seconds = stake_entry.used_stake_seconds.checked_add(ctx.accounts.receipt_manager.stake_seconds_to_use).expect("Add error");

    if stake_entry.used_stake_seconds > ctx.accounts.stake_entry.total_stake_seconds {
        return Err(error!(ErrorCode::InsufficientAvailableStakeSeconds));
    }

    // handle payment
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    handle_payment(
        ctx.accounts.receipt_manager.payment_amount,
        ctx.accounts.receipt_manager.payment_mint,
        &ctx.accounts.receipt_manager.payment_shares,
        remaining_accounts,
    )?;

    // handle action payment
    assert_payment_info(
        ctx.accounts.receipt_manager.stake_pool,
        Action::ClaimRewardReceipt,
        ctx.accounts.receipt_manager.claim_action_payment_info,
    )?;
    handle_payment_info(ctx.accounts.receipt_manager.claim_action_payment_info, remaining_accounts)?;

    Ok(())
}
