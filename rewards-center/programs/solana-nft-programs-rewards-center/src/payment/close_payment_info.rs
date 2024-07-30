use crate::errors::ErrorCode;
use crate::PaymentInfo;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClosePaymentInfoCtx<'info> {
    #[account(mut, close = payment_info)]
    payment_info: Box<Account<'info, PaymentInfo>>,

    #[account(mut, constraint = payment_info.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<ClosePaymentInfoCtx>) -> Result<()> {
    Ok(())
}
