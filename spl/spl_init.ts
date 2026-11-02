import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithBlockhashLifetime,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

//import your wallet
import wallet from "/home/ohad/solana/Turbin3/id2.json";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

(async () => {
  try { 
        const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
    console.log(`Wallet: ${signer.address}`);

    const mint = await generateKeyPairSigner();
    console.log(`Mint address: ${mint.address}`);

        const space = getMintSize();
    const lamports = await rpc
      .getMinimumBalanceForRentExemption(BigInt(space))
      .send();
    console.log(`Mint account needs ${space} bytes and ${lamports} lamports`);

    const createAccountIx = getCreateAccountInstruction({
      payer: signer,
      newAccount: mint,
      lamports,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });

        const initMintIx = getInitializeMintInstruction({
      mint: mint.address,
      decimals: 10,
      mintAuthority: signer.address,
      freezeAuthority: null,
    });


    
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });
    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);
    const msgWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      msgWithPayer,
    );
    const txMessage = appendTransactionMessageInstructions(
      [createAccountIx, initMintIx],
      msgWithLifetime,
    );



    const signedTx = await signTransactionMessageWithSigners(txMessage);
    assertIsTransactionWithBlockhashLifetime(signedTx);

    const signature = getSignatureFromTransaction(signedTx);

    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });
    await sendAndConfirm(signedTx, { commitment: "confirmed" });

    console.log(`init txid: ${signature}`);
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`\n>>> paste this mint address into the next scripts:\n${mint.address}`);

  } catch (error) {
    console.log(error);
  }
})();
