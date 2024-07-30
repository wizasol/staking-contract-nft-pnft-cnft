use anchor_lang::prelude::*;

pub const REWARD_ENTRY_SEED: &str = "reward-entry";
pub const REWARD_ENTRY_SIZE: usize = 8 + std::mem::size_of::<RewardEntry>() + 64;
#[account]
pub struct RewardEntry {
    pub bump: u8,
    pub stake_entry: Pubkey,
    pub reward_distributor: Pubkey,
    pub reward_seconds_received: u128,
    pub multiplier: u64,
}

pub const REWARD_DISTRIBUTOR_SEED: &str = "reward-distributor";
pub const REWARD_DISTRIBUTOR_SIZE: usize = 8 + std::mem::size_of::<RewardDistributor>() + 64;
#[account]
pub struct RewardDistributor {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub kind: u8,
    pub authority: Pubkey,
    pub identifier: u64,
    pub reward_mint: Pubkey,
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub rewards_issued: u128,
    pub default_multiplier: u64,
    pub multiplier_decimals: u8,
    pub claim_rewards_payment_info: Pubkey,
    pub max_reward_seconds_received: Option<u128>,
}
