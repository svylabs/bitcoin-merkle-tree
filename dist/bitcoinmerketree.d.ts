export type MerkleProof = {
    hashes: string[];
    index: number;
    found: boolean;
};
export declare class BitcoinMerkleTree {
    private originalTxHashes;
    private root;
    private txHashes;
    private hashes;
    /**
     *
     * @param txHashes Transaction hashes in little endian format as returned by Bitcoin RPC
     */
    constructor(txHashes: string[]);
    private createTree;
    private createSubTreeRootFromPartial;
    getRoot(): string;
    private toHex;
    getInclusionProof(txHash: string): MerkleProof;
    private getBits;
    private generateProof;
    verifyProof(leaf: string, proof: MerkleProof): boolean;
}
