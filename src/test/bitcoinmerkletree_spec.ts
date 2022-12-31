import {expect} from 'chai';
import { BitcoinMerkleTree } from '../bitcoinmerketree';

describe("MerkleTreeTest", () => {
    // test case for average here

    describe("create merkle tree", () => {
        it("Happy case", () => {
            const txIds = [
                Buffer.from("8c14f0db3df150123e6f3dbbf30f8b955a8249b62ac1d1ff16284aefa3d06d87", "hex").reverse(),
                Buffer.from("fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4", "hex").reverse(),
                Buffer.from("6359f0868171b1d194cbee1af2f16ea598ae8fad666d9b012c8ed2b79a236ec4", "hex").reverse(),
                Buffer.from("e9a66845e05d5abc0ad04ec80f774a7e585c6e8db975962d069a522137b80c1d", "hex").reverse()
            ];
            const instance = new BitcoinMerkleTree(txIds);
            console.log(instance.getRoot());
            expect(instance.getRoot()).to.be.string("f3e94742aca4b5ef85488dc37c06c3282295ffec960994b2c0d5ac2a25a95766");
        });
    });
});