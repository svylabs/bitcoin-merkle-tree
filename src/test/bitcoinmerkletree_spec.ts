import {expect} from 'chai';
import { BitcoinMerkleTree } from '../bitcoinmerketree';
import {biggerDataSet, dataset239Txs} from './testdata';

describe("MerkleTreeTest", () => {
    // test case for average here

    describe("create merkle tree", () => {
        it("Happy case", () => {
            const txs = [
                "bcdc61cbecf6137eec5c8ad4047fcdc36710e77e404b17378a33ae605920afe1",
                "f7f4c281ee20ab8d1b00734b92b60582b922211a7e470accd147c6d70c9714a3",
                "b5f6e3b217fa7f6d58081b5d2a9a6607eebd889ed2c470191b2a45e0dcb98eb0",
                "4206f171f06913b1d40597edcaf75780559231fb504c49ba85a4a9ae949e8b95",
                "a1a6ad6ff321c76496a89b6a4eb9bcfb76b9e068b677d5c7d427c51ca08c273d",
                "89c82039452c14a9314b5834e5d2b9241b1fdccdb6e4f4f68e49015540faaf95",
                "25c6a1f8c0b5be2bee1e8dd3478b4ec8f54bbc3742eaf90bfb5afd46cf217ad9",
                "57eef4da5edacc1247e71d3a93ed2ccaae69c302612e414f98abf8db0b671eae",
                "8d30eb0f3e65b8d8a9f26f6f73fc5aafa5c0372f9bb38aa38dd4c9dd1933e090",
                "13e3167d46334600b59a5aa286dd02147ac33e64bfc2e188e1f0c0a442182584"
              ]
            const instance = new BitcoinMerkleTree(txs);
            console.log(instance.getRoot());
            expect(instance.getRoot()).to.be.string("be0b136f2f3db38d4f55f1963f0acac506d637b3c27a4c42f3504836a4ec52b1");
            for (var i=0;i<txs.length;i++) {
                const proof = instance.getInclusionProof(txs[i]);
                //console.log(txs[i], proof);
                expect(instance.verifyProof(txs[i], proof)).equals(true);
            }
            for (var i=0;i<txs.length;i++) {
                const proof = instance.getInclusionProof(txs[i]);
                // Verify proof for incorrect transaction leaf should fail
                expect(instance.verifyProof(txs[(i + 5) % txs.length], proof)).equals(false);
            }
        });

        it("Bigger test", () => {
            const txs = dataset239Txs.txs;
            const instance = new BitcoinMerkleTree(txs);
            console.log(instance.getRoot());
            expect(instance.getRoot()).to.be.string(dataset239Txs.root);
            for (var i=0;i<txs.length;i++) {
                const proof = instance.getInclusionProof(txs[i]);
                //console.log(proof);
                expect(instance.verifyProof(txs[i], proof)).equals(true);
            }
        });


        it("Even Bigger dataset", () => {
            const txs = biggerDataSet.txs;
            const instance = new BitcoinMerkleTree(txs);
            console.log(instance.getRoot());
            expect(instance.getRoot()).to.be.string(biggerDataSet.root);
            for (var i=0;i<txs.length;i++) {
                const proof = instance.getInclusionProof(txs[i]);
                //console.log(proof);
                expect(instance.verifyProof(txs[i], proof)).equals(true);
            }
        });
    });
});