
import * as crypto from 'crypto';

function hash(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
}

function doubleHash(data: Buffer): Buffer {
    return hash(hash(data));
}

export type Proof = {
    nodes: string[],
    flags: string
};

export class BitcoinMerkleTree {
    private root: Buffer;
    private txHashes: Buffer[];

    /**
     * 
     * @param txHashes Transaction hashes in little endian format as returned by Bitcoin RPC
     */
    constructor(txHashes: string[]) {
        this.txHashes = txHashes.map((hash) => Buffer.from(hash, "hex").reverse());
        this.root = this.createTree(this.txHashes);
    }

    private createTree(txHashes: Buffer[]) {
        let hashes = Array.of(...txHashes);
        let len = hashes.length;
        if (len != 1 && len % 2 == 1) {
            hashes.push(hashes[len - 1]);
            len++;
        }
        while (len > 1) {  
            if (len % 2 == 1) {
                hashes[len] = hashes[len - 1];
                len++;
            }
            for (var i = 0; i < len / 2; i++) {
                hashes[i] = doubleHash(Buffer.concat([hashes[2 * i], hashes[(2 * i) + 1]]));
            }
            len = len / 2;
        }
        return hashes[0];
    }

    public getRoot(): string {
        const root = Buffer.from(this.root);
        return root.reverse().toString("hex");
    }

    public getInclusionProof(txHash: string) {
        // Generate Transaction inclusion proof
    }
    public verifyProof(leaf: string, root: string, proof: Proof) {
        // Verifies that leaf is a part of the root based on proof
    }

}