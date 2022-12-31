
import * as crypto from 'crypto';

function hash(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
}

function doubleHash(data1: Buffer, data2: Buffer): Buffer {
    return hash(crypto.createHash('sha256').update(data1).update(data2).digest());
}

export type Proof = {
    nodes: string[],
    flags: string
};

export class BitcoinMerkleTree {
    private root: Buffer;
    private txHashes: Buffer[];

    constructor(txHashes: Buffer[]) {
        this.txHashes = txHashes.map((hash) => hash.reverse());
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
                hashes[i] = doubleHash(hashes[2 * i], hashes[(2 * i) + 1]);
            }
            len = len / 2;
        }
        return hashes[0];
    }

    public getRoot(): string {
        const root = Buffer.from(this.root);
        return root.reverse().toString("hex");
    }

    public getInclusionProof(hash: string) {
        // Generate Transaction inclusion proof
    }
    public verifyProof(leaf: string, root: string, proof: Proof) {
        // Verifies that leaf is a part of the root based on proof
    }

}