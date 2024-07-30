use crate::errors::ErrorCode;
use crate::reward_receipts::ReceiptManager;
use crate::reward_receipts::RewardReceipt;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseRewardReceiptCtx<'info> {
    #[account(mut, close = authority, constraint = reward_receipt.receipt_manager == receipt_manager.key() @ ErrorCode::InvalidRewardReceipt)]
    reward_receipt: Box<Account<'info, RewardReceipt>>,
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(mut, constraint = receipt_manager.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseRewardReceiptCtx>) -> Result<()> {
    Ok(())
}
