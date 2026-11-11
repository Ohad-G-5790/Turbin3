First I made sure the right account are defined in withdraw.rs
We have the user, the vault state account, the vault account and the system program.

the I created a function that checks if there is more than 0 in the vault account, then withdraws the amount in the vault from the vault to the user account, using new_with_signer because its the vault account that needs to sign.

Then I created the Close.rs
defined same accounts, user, vault state, vault and the system program.

The function is to close, so no need to check if there is anything there.
Same as withdraw but we also make sure the rent amount is going back to the user.

