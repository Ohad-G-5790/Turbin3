First I made sure the right account are defined in withdraw.rs
We have the user, the vault state account, the vault account and the system program.

the I created a function that checks if there is more than 0 in the vault account, then withdraws the amount in the vault from the vault to the user account, using new_with_signer because its the vault account that needs to sign.
