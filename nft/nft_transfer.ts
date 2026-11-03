import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "/home/ohad/solana/Turbin3/id2.json";
import {
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { create, mplCore, fetchAsset, transfer} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(mplCore());

const asset = publicKey("DX2qVecRRwRJDFugB35TV8LcPmN4RLbrofYzgjmFiiG1"); //paste your mint address got from spl_init.ts

const newOwner = publicKey("9Mvs2A2ZppWbV1NZXk6XPhkJLjhbTQjnjkj3D8h4Yxit"); //paste the address of the recipient
  
(async () => {
  try {
const nft = await fetchAsset(umi, asset);
  console.log(`Owner of NFT is ${nft.owner}`);
  console.log(`${nft.owner === signer.publicKey}`);
    // 2. Send the transaction
    await transfer(umi, {
  asset: nft,
  newOwner: newOwner
}).sendAndConfirm(umi);

    // 3. Print the result
    console.log(`Owner ${signer.publicKey} transferred NFT ${asset} to ${newOwner}`);
    

  } catch (error) {
    console.log(error);
  }
})();
