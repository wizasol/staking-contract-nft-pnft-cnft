use crate::assert_payment_info;
use crate::utils::resize_account;
use crate::Action;
use crate::StakePool;
use crate::STAKE_POOL_DEFAULT_SIZE;
use crate::STAKE_POOL_PREFIX;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitPoolIx {
    allowed_collections: Vec<Pubkey>,
    allowed_creators: Vec<Pubkey>,
    requires_authorization: bool,
    authority: Pubkey,
    reset_on_unstake: bool,
    cooldown_seconds: Option<u32>,
    min_stake_seconds: Option<u32>,
    end_date: Option<i64>,
    stake_payment_info: Pubkey,
    unstake_payment_info: Pubkey,
    identifier: String,
}

#[derive(Accounts)]
#[instruction(ix: InitPoolIx)]
pub struct InitPoolCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_POOL_DEFAULT_SIZE,
        seeds = [STAKE_POOL_PREFIX.as_bytes(), ix.identifier.as_ref()],
        bump
    )]
    stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitPoolCtx>, ix: InitPoolIx) -> Result<()> {
    let bump = *ctx.bumps.get("stake_pool").unwrap();
    let identifier = ix.identifier;
    let new_stake_pool = StakePool {
        bump,
        authority: ix.authority,
        total_staked: 0,
        reset_on_unstake: ix.reset_on_unstake,
        cooldown_seconds: ix.cooldown_seconds,
        min_stake_seconds: ix.min_stake_seconds,
        end_date: ix.end_date,
        stake_payment_info: ix.stake_payment_info,
        unstake_payment_info: ix.unstake_payment_info,
        requires_authorization: ix.requires_authorization,
        allowed_creators: ix.allowed_creators,
        allowed_collections: ix.allowed_collections,
        identifier,
    };

    assert_payment_info(ctx.accounts.stake_pool.key(), Action::Stake, ix.stake_payment_info)?;
    assert_payment_info(ctx.accounts.stake_pool.key(), Action::Unstake, ix.unstake_payment_info)?;

    let stake_pool = &mut ctx.accounts.stake_pool;
    let new_space = new_stake_pool.try_to_vec()?.len() + 8;

    resize_account(
        &stake_pool.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    stake_pool.set_inner(new_stake_pool);
    Ok(())
}
