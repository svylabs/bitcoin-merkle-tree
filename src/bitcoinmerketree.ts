
import * as crypto from 'crypto';

function hash(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
}

function doubleHash(data: Buffer): Buffer {
    return hash(hash(data));
}

export type MerkleProof = {
    hashes: string[],
    index: number,
    found: boolean
};

export class BitcoinMerkleTree {
    private originalTxHashes: string[];
    private root: Buffer;
    private txHashes: Buffer[];
    private hashes: {
        hash: Buffer,
        leftChild: number,
        rightChild: number,
        fromIndex: number,
        toIndex: number
    }[];

    /**
     * 
     * @param txHashes Transaction hashes in little endian format as returned by Bitcoin RPC
     */
    constructor(txHashes: string[]) {
        this.originalTxHashes= txHashes;
        this.txHashes = txHashes.map((hash) => Buffer.from(hash, "hex").reverse());
        this.root = this.createTree(this.txHashes);
    }

    private createTree(txHashes: Buffer[]) {
        this.hashes = txHashes.map((hash, index) => {
            return {
                hash: hash,
                leftChild: -1,
                rightChild: -1,
                fromIndex: index,
                toIndex: index
            }
        });
        let len = this.hashes.length;
        if (len != 1 && len % 2 == 1) {
            this.hashes.push(this.hashes[len - 1]);
            len++;
        }
        let startIndex = 0;
        while (len > 1) {
            if (len % 2 == 1) {
                this.hashes.push({
                    hash: this.hashes[this.hashes.length - 1].hash,
                    leftChild: -1,
                    rightChild: -1,
                    fromIndex: -1, 
                    toIndex: -1
                });
                len++;
            }
            for (var i = 0; i < len / 2; i++) {
                this.hashes.push({
                    hash: doubleHash(Buffer.concat([this.hashes[startIndex + 2 * i].hash, this.hashes[startIndex + (2 * i) + 1].hash])),
                    leftChild: startIndex + 2 * i,
                    rightChild: startIndex + (2 * i) + 1,
                    fromIndex: this.hashes[startIndex + 2 * i].fromIndex,
                    toIndex: Math.max(this.hashes[startIndex + (2 * i) + 1].toIndex, this.hashes[startIndex + 2 * i].toIndex)
                });
            }
            startIndex += len;
            len = len / 2;
        }
        return this.hashes[this.hashes.length - 1].hash;
    }

    private createSubTreeRootFromPartial(from: number, to: number): Buffer {
        return null;
    }

    public getRoot(): string {
        return this.toHex(this.root);
    }

    private toHex(data: Buffer): string {
        const d = Buffer.from(data);
        return d.reverse().toString("hex");
    }

    public getInclusionProof(txHash: string): MerkleProof {
        // Generate Transaction inclusion proof
        const index = this.originalTxHashes.findIndex((val, ind) => {
            if (val === txHash) {
                return true;
            }
        });
        if (index == -1) return null;
        const result = this.generateProof(txHash, index, this.hashes.length - 1, 0);
        result.index = result.index | (1 << this.getBits());
        return result;
    }

    private getBits(): number {
        return Math.ceil(Math.log2(this.originalTxHashes.length));
    }

    private generateProof(txHash: string, index: number, root: number, depth: number): MerkleProof {
        let totalBits = 0;
        const totalSize = Math.pow(2, totalBits);
        if (this.hashes[root].leftChild == -1 && this.hashes[root].rightChild == -1) {
            const found = (this.toHex(this.hashes[root].hash) === txHash);
            return {
                hashes: [
                    this.toHex(this.hashes[root].hash)
                ],
                index: index,
                found: found
            }
        }
        if (index < this.hashes[root].fromIndex || index > this.hashes[root].toIndex) {
            const found = (this.toHex(this.hashes[root].hash) === txHash);
            return {
                hashes: [
                    this.toHex(this.hashes[root].hash)
                ],
                index: index,
                found: found
            }
        }
        if (index >= this.hashes[root].fromIndex && index <= this.hashes[root].toIndex) {
            const leftProof = this.generateProof(txHash, index, this.hashes[root].leftChild, depth + 1);
            const rightProof = this.generateProof(txHash, index, this.hashes[root].rightChild, depth + 1);
            let first = leftProof;
            let second = rightProof;
            if (rightProof.found) {
                first = rightProof;
                second = leftProof;
            }
            return {
                hashes: [
                    ...first.hashes,
                    ...second.hashes
                ],
                index: index,
                found: leftProof.found || rightProof.found
            };
        }
    }

    public verifyProof(leaf: string, proof: MerkleProof): boolean {
        // Verifies that leaf is a part of the root based on proof
        const hashes: Buffer[] = [];
        let hash = Buffer.from(proof.hashes[0], "hex").reverse();
        let index = proof.index;
        let i = 1;
        while (index > 1) {
            if (index & 1) {
                hash = doubleHash(Buffer.concat([Buffer.from(proof.hashes[i], "hex").reverse(), hash]));
            } else {
                hash = doubleHash(Buffer.concat([hash, Buffer.from(proof.hashes[i], "hex").reverse()]));
            }
            i++;
            index = index >> 1;
        }
        return (leaf === proof.hashes[0] && this.toHex(hash) === this.getRoot());
    }
}