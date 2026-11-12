use anchor_lang::prelude::*;

use crate::{Escrow, ESCROW_SEED};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{close_account, transfer_checked, Mint, TokenAccount, TokenInterface, CloseAccount, TransferChecked},
};

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    #[account(
        mut,
        associated_token::mint = escrow.mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = escrow.mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        close = maker,
        seeds = [ESCROW_SEED, escrow.maker.as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = mint_a,
        has_one = mint_b,
        has_one = maker
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        associated_token::mint = escrow.mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = escrow.mint_b,
        associated_token::authority = escrow.maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mint::token_program = token_program,
    )]
    pub mint_a: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint_b: Box<InterfaceAccount<'info, Mint>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Take<'info> {
    pub fn take(&mut self) -> Result<()> {
        let escrow = &self.escrow;
        let vault = &self.vault;
        let taker_ata_a = &self.taker_ata_a;
        let taker_ata_b = &self.taker_ata_b;
        let maker_ata_b = &self.maker_ata_b;

        // Transfer token B from taker to maker
        transfer_checked(
            CpiContext::new(
                self.token_program.key(),
                TransferChecked {
                    from: taker_ata_b.to_account_info(),
                    to: maker_ata_b.to_account_info(),
                    authority: self.taker.to_account_info(),
                    mint: self.mint_b.to_account_info(),
                },
            ),
            escrow.receive,
            self.mint_b.decimals,
        )?;

        // Transfer token A from vault to taker
        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.key(),
                TransferChecked {
                    from: vault.to_account_info(),
                    to: taker_ata_a.to_account_info(),
                    authority: escrow.to_account_info(),
                    mint: self.mint_a.to_account_info(),
                },
                &[&[ESCROW_SEED, escrow.maker.as_ref(), escrow.seed.to_le_bytes().as_ref(), &[escrow.bump]]],
            ),
            vault.amount,
            self.mint_a.decimals,
        )?;
        let signer_seeds: [&[&[u8]]; 1] = [&[
            ESCROW_SEED,
            self.maker.key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];
        let cpi_program = self.token_program.key();

        let cpi_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        close_account(cpi_context)?;

        Ok(())
    }
}