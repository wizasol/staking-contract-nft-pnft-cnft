use anchor_lang::prelude::*;

pub const STAKE_POOL_DEFAULT_SIZE: usize = 8 + 1 + 32 + 8 + 1 + 32 + 32 + 1 + 24;
pub const STAKE_POOL_PREFIX: &str = "stake-pool";
#[account]
pub struct StakePool {
    pub bump: u8,
    pub authority: Pubkey,
    pub total_staked: u32,
    pub reset_on_unstake: bool,
    pub cooldown_seconds: Option<u32>,
    pub min_stake_seconds: Option<u32>,
    pub end_date: Option<i64>,
    pub stake_payment_info: Pubkey,
    pub unstake_payment_info: Pubkey,
    pub requires_authorization: bool,
    pub allowed_creators: Vec<Pubkey>,
    pub allowed_collections: Vec<Pubkey>,
    pub identifier: String,
}
