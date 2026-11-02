import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import wallet from "/home/ohad/solana/Turbin3/id2.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz/",
  }),
);

umi.use(signerIdentity(signer));

(async () => {
  try {
    //change the image uri to your image uri obtained from nft_image.ts
    const image =
      "https://gateway.irys.xyz/B9A4UsYhP28girCrYBr6dGFgShAVCUjfpzDNaudPMLXx";

    const metadata = {
            name: "Austria #1",
            description: "Epic window view to a lake",
            image,
            attributes: [{ trait_type: "Rarity", value: "Epic", },
{ trait_type: "View", value: "Landscape", }, { trait_type: "Country", value: "Austria", }],
            
            properties: {
                files: [
                    {
                        type: "image/jpeg",  
                        uri: image,        
                    },
                ],
                category: "image",      
            },

        };
          const myUri = await umi.uploader.uploadJson([metadata]);
    console.log(`metadata uri: ${myUri} `);
  } catch (error) {
    console.log("error", error);
  }
})();
