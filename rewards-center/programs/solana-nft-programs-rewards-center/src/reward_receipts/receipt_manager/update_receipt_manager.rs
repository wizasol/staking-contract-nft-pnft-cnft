use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::reward_receipts::ReceiptManager;
use crate::Action;
use crate::PaymentShare;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateReceiptManagerIx {
    pub authority: Pubkey,
    pub required_stake_seconds: u128,
    pub stake_seconds_to_use: u128,
    pub payment_mint: Pubkey,
    pub payment_amount: u64,
    pub payment_shares: Vec<PaymentShare>,
    pub requires_authorization: bool,
    pub claim_action_payment_info: Pubkey,
    pub max_claimed_receipts: Option<u128>,
}

#[derive(Accounts)]
#[instruction(ix: UpdateReceiptManagerIx)]
pub struct UpdateReceiptManagerCtx<'info> {
    #[account(mut)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(constraint = authority.key() == receipt_manager.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateReceiptManagerCtx>, ix: UpdateReceiptManagerIx) -> Result<()> {
    let receipt_manager = &mut ctx.accounts.receipt_manager;
    if let Some(max_claimed_receipts) = ix.max_claimed_receipts {
        if receipt_manager.claimed_receipts_counter > max_claimed_receipts {
            return Err(error!(ErrorCode::InvalidMaxClaimedReceipts));
        }
    }

    receipt_manager.authority = ix.authority;
    receipt_manager.required_stake_seconds = ix.required_stake_seconds;
    receipt_manager.stake_seconds_to_use = ix.stake_seconds_to_use;
    receipt_manager.requires_authorization = ix.requires_authorization;
    receipt_manager.payment_amount = ix.payment_amount;
    receipt_manager.payment_mint = ix.payment_mint;
    receipt_manager.payment_shares = ix.payment_shares;
    receipt_manager.claim_action_payment_info = ix.claim_action_payment_info;
    receipt_manager.max_claimed_receipts = ix.max_claimed_receipts;

    assert_payment_info(receipt_manager.stake_pool, Action::ClaimRewardReceipt, receipt_manager.claim_action_payment_info)?;
    Ok(())
}
