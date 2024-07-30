use anchor_lang::prelude::*;

use crate::PaymentShare;

pub const STAKE_BOOSTER_PREFIX: &str = "stake-booster";
pub const STAKE_BOOSTER_SIZE: usize = 8 + std::mem::size_of::<StakeBooster>() + 8;
#[account]
pub struct StakeBooster {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub identifier: u64,
    pub payment_amount: u64,
    pub payment_mint: Pubkey,
    pub payment_shares: Vec<PaymentShare>,
    pub boost_seconds: u128,
    pub start_time_seconds: i64,
    pub boost_action_payment_info: Pubkey,
}
