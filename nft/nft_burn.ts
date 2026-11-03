import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "/home/ohad/solana/Turbin3/phantom-devnet.json";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { burn, mplCore, fetchAsset } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
const asset = publicKey("DX2qVecRRwRJDFugB35TV8LcPmN4RLbrofYzgjmFiiG1");

umi.use(signerIdentity(signer));

umi.use(mplCore());

(async () => {
  try {
    const nft = await fetchAsset(umi, asset);
    
    //add you nft name and metadata uri
    const tx = await burn(umi, {
      asset: nft,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];

    console.log(`signature ${signature} , asset : ${asset}`);
  } catch (e) {
    console.log(`errior ${e}`);
  }
})();
