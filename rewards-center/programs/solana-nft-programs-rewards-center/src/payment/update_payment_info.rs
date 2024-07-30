use crate::errors::ErrorCode;
use crate::utils::resize_account;
use crate::BASIS_POINTS_DIVISOR;
use anchor_lang::prelude::*;

use super::PaymentInfo;
use super::PaymentShare;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePaymentInfoIx {
    authority: Pubkey,
    payment_amount: u64,
    payment_mint: Pubkey,
    payment_shares: Vec<PaymentShare>,
}

#[derive(Accounts)]
#[instruction(ix: UpdatePaymentInfoIx)]
pub struct UpdatePaymentInfoCtx<'info> {
    #[account(mut, constraint = payment_info.authority == authority.key())]
    payment_info: Account<'info, PaymentInfo>,

    authority: Signer<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdatePaymentInfoCtx>, ix: UpdatePaymentInfoIx) -> Result<()> {
    let payment_info = &mut ctx.accounts.payment_info;

    let payment_shares = ix.payment_shares;
    let share_total: u16 = payment_shares.iter().map(|s| s.basis_points).sum();
    if u64::try_from(share_total).expect("Num error") != BASIS_POINTS_DIVISOR {
        return Err(error!(ErrorCode::InvalidPaymentShares));
    }
    let new_payment_info = PaymentInfo {
        bump: payment_info.bump,
        authority: ix.authority,
        identifier: payment_info.identifier.clone(),
        payment_amount: ix.payment_amount,
        payment_mint: ix.payment_mint,
        payment_shares,
    };
    let new_space = new_payment_info.try_to_vec()?.len() + 8;
    payment_info.set_inner(new_payment_info);

    resize_account(
        &payment_info.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
