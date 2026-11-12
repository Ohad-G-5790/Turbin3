What happened here was making a take.rs file,
making sure that the taker having ata mint b account, and that mint B is going directly to the maker
making sure that the vault is releasing mint A and the PDA is signing the transaction.

afterwards creating update.rs file,
Very similar to make.rs, but not initializing the account because they are already existing.

I made sure i added in the instruction file "Update"
and I've added two tests to make sure that take.rs and update.rs are actually working on SVMlite simulator and that everything works.
