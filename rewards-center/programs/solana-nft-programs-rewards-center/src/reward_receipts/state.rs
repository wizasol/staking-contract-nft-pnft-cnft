use anchor_lang::prelude::*;

use crate::PaymentShare;

pub const RECEIPT_MANAGER_SEED: &str = "receipt-manager";
pub const RECEIPT_MANAGER_SIZE: usize = 8 + std::mem::size_of::<ReceiptManager>() + 64;
#[account]
pub struct ReceiptManager {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub required_stake_seconds: u128,
    pub stake_seconds_to_use: u128,
    pub claimed_receipts_counter: u128,
    pub requires_authorization: bool,
    pub payment_amount: u64,
    pub payment_mint: Pubkey,
    pub payment_shares: Vec<PaymentShare>,
    pub claim_action_payment_info: Pubkey,
    pub name: String,
    pub max_claimed_receipts: Option<u128>,
}

pub const REWARD_RECEIPT_SEED: &str = "reward-receipt";
pub const REWARD_RECEIPT_SIZE: usize = 8 + std::mem::size_of::<RewardReceipt>() + 64;
#[account]
pub struct RewardReceipt {
    pub bump: u8,
    pub stake_entry: Pubkey,
    pub receipt_manager: Pubkey,
    pub target: Pubkey,
    pub allowed: bool,
}
