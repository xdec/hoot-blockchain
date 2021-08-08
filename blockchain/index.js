// Get block
const Block = require('./block');

// Create Blockchain
class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    // Add new block
    addBlock(data) {
        const block = Block.mineBlock(
            this.chain[this.chain.length-1], // lastBlock
            data
        );
        // Add to blockchain
        this.chain.push(block)

        return block;
    }

    // Validate the chain
    isValidChain(chain) {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

        // Validate the blocks
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const lastBlock = chain[i-1];

            if (block.lastHash !== lastBlock.hash ||
                block.hash !== Block.blockHash(block)) {
                return false;
            }
        }

        return true;
    }

    /* 
    / Replace the chain with valid chain.
    / If the chains are the same lenght, then it's likely to be the same chain.
    /
    / Choosing a longer chain resolves the forking problem where two blockchains
    / submit a new block at the same time.
    /
    / This way, everyone can agree upon a chain with the most valid blocks within
    / it. Which resolves any previous forking issues.
    */
    replaceChain(newChain) {
        // Only replace the chain if it's longer or valid
        if(newChain.length <= this.chain.length) {
            console.log('Received chain is not longer than current chain');
            return;
        } else if(!this.isValidChain(newChain)) {
            console.log('The received chain is not valid.');
            return;
        }

        console.log('Replacing the blockchain with the new chain.');
        this.chain = newChain;
    }
}

module.exports = Blockchain;