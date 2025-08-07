import {
    _preRequisite,
    _initialize,
    _change_authority,
    _add_validator,
    _remove_validator,
    _set_validator_score,
    _config_validator_system,
    _deposit_stake_account,
    _liquid_unstake,
    _add_liquidity,
    _remove_liquidity,
    _config_lp,
    _config_marinade,
    _order_unstake,
    _claim,
    _stake_reserve,
    _update_active,
    _update_deactivated,
    _deactivate_stake,
    _emergency_unstake,
    _partial_unstake,
    _merge_stakes,
    _redelegate,
    _pause,
    _resume,
    _withdraw_stake_account,
    _realloc_validator_list,
    _realloc_stake_list,
} from "./src/order";


const main = async () => {
    // await _preRequisite()
    // await _initialize()
    // await _change_authority()
    // await _add_validator()
    // await _remove_validator()
    // await _set_validator_score()
    // await _config_validator_system()
    // await _deposit()
    // await _deposit_stake_account()
    // await _liquid_unstake()
    // await _add_liquidity()
    // await _remove_liquidity()
    // await _config_lp()
    // await _config_marinade()
    // await _order_unstake()
    // await _claim()
    // await _stake_reserve()
    // await _update_active()

    await _update_deactivated()     // require deactivated or deactivating (deactivation_epoch != u64::MAX)
    // await _deactivate_stake()       // require compute total required stake delta (i128, must be negative)

    // await _emergency_unstake()
    // await _partial_unstake()
    // await _merge_stakes()
    // await _redelegate()
    // await _pause()
    // await _resume()
    // await _withdraw_stake_account()
    // await _realloc_validator_list()
    // await _realloc_stake_list()
}

main()