use crate::errors::ErrorCode;
use crate::utils::resize_account;
use crate::BASIS_POINTS_DIVISOR;
use anchor_lang::prelude::*;

use super::PaymentInfo;
use super::PaymentShare;
use super::DEFAULT_PAYMENT_INFO_SIZE;
use super::PAYMENT_INFO_PREFIX;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitPaymentInfoIx {
    authority: Pubkey,
    identifier: String,
    payment_amount: u64,
    payment_mint: Pubkey,
    payment_shares: Vec<PaymentShare>,
}

#[derive(Accounts)]
#[instruction(ix: InitPaymentInfoIx)]
pub struct InitPaymentInfoCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = DEFAULT_PAYMENT_INFO_SIZE,
        seeds = [PAYMENT_INFO_PREFIX.as_bytes(), ix.identifier.as_ref()],
        bump
    )]
    payment_info: Account<'info, PaymentInfo>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitPaymentInfoCtx>, ix: InitPaymentInfoIx) -> Result<()> {
    let bump = *ctx.bumps.get("payment_info").unwrap();
    let identifier = ix.identifier;
    let payment_shares = ix.payment_shares;
    let share_total: u16 = payment_shares.iter().map(|s| s.basis_points).sum();
    if u64::try_from(share_total).expect("Num error") != BASIS_POINTS_DIVISOR {
        return Err(error!(ErrorCode::InvalidPaymentShares));
    }

    let new_payment_info = PaymentInfo {
        bump,
        authority: ix.authority,
        identifier,
        payment_amount: ix.payment_amount,
        payment_mint: ix.payment_mint,
        payment_shares,
    };

    let payment_info = &mut ctx.accounts.payment_info;
    let new_space = new_payment_info.try_to_vec()?.len() + 8;

    resize_account(
        &payment_info.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    payment_info.set_inner(new_payment_info);
    Ok(())
}
