use crate::errors::ErrorCode;
use crate::reward_distribution::RewardDistributor;
use crate::reward_distribution::RewardEntry;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseRewardEntryCtx<'info> {
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(mut, close = authority, constraint = reward_entry.reward_distributor == reward_distributor.key() @ ErrorCode::InvalidRewardDistributor)]
    reward_entry: Box<Account<'info, RewardEntry>>,
    #[account(mut, constraint = reward_distributor.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseRewardEntryCtx>) -> Result<()> {
    Ok(())
}
