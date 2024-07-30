use std::cmp::Ordering;

use anchor_lang::prelude::*;
use anchor_lang::Result;
use solana_program::program::invoke;
use solana_program::system_instruction::transfer;

pub fn resize_account<'info>(account_info: &AccountInfo<'info>, new_space: usize, payer: &AccountInfo<'info>, system_program: &AccountInfo<'info>) -> Result<()> {
    let rent = Rent::get()?;
    msg!("resize {} => {}", account_info.data_len(), new_space);
    let new_minimum_balance = rent.minimum_balance(new_space);
    let current_balance = account_info.lamports();

    match new_minimum_balance.cmp(&current_balance) {
        Ordering::Greater => {
            let lamports_diff = new_minimum_balance.saturating_sub(current_balance);
            invoke(
                &transfer(&payer.key(), &account_info.key(), lamports_diff),
                &[payer.clone(), account_info.clone(), system_program.clone()],
            )?;
        }
        Ordering::Less => {
            let lamports_diff = current_balance.saturating_sub(new_minimum_balance);
            **account_info.try_borrow_mut_lamports()? = new_minimum_balance;
            **payer.try_borrow_mut_lamports()? = payer.lamports().checked_add(lamports_diff).expect("Add error");
        }
        Ordering::Equal => {}
    }
    account_info.realloc(new_space, false)?;
    Ok(())
}
