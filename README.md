# bitcoin-merkle-tree

This library provides a way to create merkle tree from a list of transaction ids and has functions to generate merkle proof of inclusion and verification.

The format of the proof is slightly different from the one generated using `bitcoin-cli`.

The MerkleProof has two elements, the list of hashes (tx ids) and flags that shows how to process the hashes.
```
    {
        "hashes": [

        ],
        "flags": ""
    }
```

The flags are much more intuitive in this format of proof than the one on `bitcoin-cli`. The format uses `postfix` notation and here is how to interpret the flags.

Initialize a stack with empty array.
0 - Load the next hash to the stack from the hashes list
1 - Take two elements from top of the stack, combine the hashes and make double sha256 hash and put the result on to stack.

After processing all the flags and hashes, the merkle root will be available at the top of the stack.

