use crate::assert_payment_info;
use crate::utils::resize_account;
use crate::Action;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePoolIx {
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
}

#[derive(Accounts)]
#[instruction(ix: UpdatePoolIx)]
pub struct UpdatePoolCtx<'info> {
    #[account(mut, constraint = stake_pool.authority == authority.key())]
    stake_pool: Account<'info, StakePool>,
    authority: Signer<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdatePoolCtx>, ix: UpdatePoolIx) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;

    assert_payment_info(stake_pool.key(), Action::Stake, ix.stake_payment_info)?;
    assert_payment_info(stake_pool.key(), Action::Unstake, ix.unstake_payment_info)?;

    let new_stake_pool = StakePool {
        bump: stake_pool.bump,
        authority: ix.authority,
        total_staked: stake_pool.total_staked,
        reset_on_unstake: ix.reset_on_unstake,
        cooldown_seconds: ix.cooldown_seconds,
        min_stake_seconds: ix.min_stake_seconds,
        end_date: ix.end_date,
        stake_payment_info: ix.stake_payment_info,
        unstake_payment_info: ix.unstake_payment_info,
        requires_authorization: ix.requires_authorization,
        allowed_creators: ix.allowed_creators,
        allowed_collections: ix.allowed_collections,
        identifier: stake_pool.identifier.clone(),
    };
    let new_space = new_stake_pool.try_to_vec()?.len() + 8;
    stake_pool.set_inner(new_stake_pool);

    resize_account(
        &stake_pool.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
