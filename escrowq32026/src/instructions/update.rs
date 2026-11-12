use anchor_lang::prelude::*;

use crate::{Escrow, ESCROW_SEED};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Update<'info> {
    #[account(mut)]

    pub maker: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]

    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(
        mint::token_program = token_program
    )]
    
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        has_one = mint_a,
        has_one = mint_b,
        has_one = maker,
        seeds = [ESCROW_SEED, maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
impl<'info> Update<'info> {

    //Deposit tokens from maker to vault
    pub fn update(&mut self, new_deposit: u64, new_receive: u64) -> Result<()> {
        self.escrow.receive = new_receive;
        let current_amount = self.vault.amount;

        if new_deposit > current_amount {
            let additional_deposit = new_deposit - current_amount;
            self.deposit_to_vault(additional_deposit)?;
        } else if new_deposit < current_amount {
            let excess_amount = current_amount - new_deposit;
            self.withdraw_from_vault(excess_amount)?;
        }     Ok(())
    }
    fn deposit_to_vault(&mut self, amount: u64) -> Result<()> {
            let transfer_accounts = TransferChecked {
            from: self.maker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.key(), transfer_accounts);

        transfer_checked(cpi_ctx, amount, self.mint_a.decimals)
    }
        fn withdraw_from_vault(&mut self, amount: u64) -> Result<()> {
            
        let signer_seeds: [&[&[u8]]; 1] = [&[
            ESCROW_SEED,
            self.maker.key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let cpi_program = self.token_program.key();

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        transfer_checked(cpi_context, amount, self.mint_a.decimals)

    }
}
