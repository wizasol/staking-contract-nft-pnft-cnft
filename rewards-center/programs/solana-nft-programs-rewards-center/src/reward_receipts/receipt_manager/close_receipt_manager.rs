use crate::errors::ErrorCode;
use crate::reward_receipts::ReceiptManager;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseReceiptManagerCtx<'info> {
    #[account(mut, close = authority)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(mut, constraint = receipt_manager.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseReceiptManagerCtx>) -> Result<()> {
    Ok(())
}
