
import * as crypto from 'crypto';

function hash(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
}

function doubleHash(data: Buffer): Buffer {
    return hash(hash(data));
}

export type MerkleProof = {
    nodes: string[],
    flags: string
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
        return this.generateProof(index, this.hashes.length - 1);
    }

    private static isCompleteSubTree(from: number, to: number): boolean {
        const numNodes = to - from + 1;
        return (Math.pow(2, Math.log2(numNodes)) === numNodes);
    }

    private generateProof(index: number, root: number): MerkleProof {
        let totalBits = 0;
        const totalSize = Math.pow(2, totalBits);
        if (this.hashes[root].leftChild == -1 && this.hashes[root].rightChild == -1) {
            return {
                nodes: [
                    this.toHex(this.hashes[root].hash)
                ],
                flags: "0"
            }
        }
        if (index < this.hashes[root].fromIndex || index > this.hashes[root].toIndex) {
            return {
                nodes: [
                    this.toHex(this.hashes[root].hash)
                ],
                flags: "0"
            }
        }
        if (index >= this.hashes[root].fromIndex && index <= this.hashes[root].toIndex) {
            const leftProof = this.generateProof(index, this.hashes[root].leftChild);
            const rightProof = this.generateProof(index, this.hashes[root].rightChild);
            return {
                nodes: [
                    ...leftProof.nodes,
                    ...rightProof.nodes
                ],
                flags: leftProof.flags + rightProof.flags + "1"
            };
        }
    }

    public verifyProof(leaf: string, root: string, proof: MerkleProof): boolean {
        // Verifies that leaf is a part of the root based on proof
        const hashes: Buffer[] = [];
        let nodesIndex = 0;
        let hashesIndex = 0;
        for (var i = 0; i < proof.flags.length;i++) {
            if (proof.flags[i] == '0') {
                if (hashesIndex >= hashes.length) {
                    hashes.push(Buffer.from(proof.nodes[nodesIndex++], "hex").reverse());
                } else {
                    hashes[hashesIndex] = Buffer.from(proof.nodes[nodesIndex++], "hex").reverse();
                }
                hashesIndex++;
            } else {
                hashes[hashesIndex - 2] = doubleHash(Buffer.concat([hashes[hashesIndex - 2], hashes[hashesIndex - 1]]));
                hashesIndex--;
            }
        }
        return this.getRoot() === this.toHex(hashes[0]);
    }

}