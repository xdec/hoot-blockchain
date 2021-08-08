const ChainUtil = require('../chain-util');
const { DIFFICULTY, MINE_RATE } = require('../config');

// # Block Creator
class Block {
    constructor(timestamp, lastHash, hash, data, nonce, difficulty) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || DIFFICULTY; // Dynamically generated based on number of peers || system set
    }

    // Debugging
    toString() {
        /* 
        /   Use substring to take only 10 chars to print 
        /   the hash with enough chars to be unique.
        */
        return `Block -
            Timestamp:      ${this.timestamp}
            Last Hash:      ${this.lastHash.substring(0, 10)}
            Hash:           ${this.hash.substring(0,10)}
            Nonce:          ${this.nonce}
            Difficulty:     ${this.difficulty}
            Data:           ${this.data}
        `;
    }

    // Genesis block
    static genesis() {
        /*
        / Using 'static' allows us to call
        / the genesis function without needing
        / to create a new instance of the
        / block class.
        */
        return new this(
            'Genesis Time',                     // Genesis Time
            '-----',                            // Empty Hash
            'g-01101111-01110111-01101100',     // Genesis Hash | owl
            [],                                 // Block Data
            0,                                  // Block Nonce
            DIFFICULTY                          // System set difficulty
        );
    }

    // Mine new blocks
    static mineBlock(lastBlock, data) {
        let hash, timestamp;
        const lastHash = lastBlock.hash; // Get hash from previous block.
        let nonce = 0;
        let { difficulty } = lastBlock; // Local difficulty assigned to difficulty key of last block object
        // No need to create 'data' var as it's pulled from the arguments.

        // Proof of work
        do {
            nonce++;
            timestamp = Date.now();

            // Recalculate difficulty
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);

            // Update current hash
            hash = Block.hash(
                timestamp,
                lastHash,
                data,
                nonce,
                difficulty
            );
        } while(
            hash.substring(0, difficulty) 
            !== '0'.repeat(difficulty)
        ); // This loop gets the node to spend computational power to find hash value
        

        return new this(timestamp, lastHash, hash, data, nonce, difficulty);
    }

    // Create a hash
    static hash(timestamp, lastHash, data, nonce, difficulty) {
        return ChainUtil.hash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
    }

    // Create a block hash
    static blockHash(block) {
        const { timestamp, lastHash, data, nonce, difficulty } = block;
        return Block.hash(timestamp, lastHash, data, nonce, difficulty);
    }

    // Dynamically update difficulty
    static adjustDifficulty(lastBlock, currentTime) {
        /*
        /   Adjust difficulty based on timestamp of last block
        /   and the timestamp for the current time.
        /
        /   Check if the sum of the last blocks timestamp
        /   plus a mine rate value is greater than the current time.
        /
        /   If this is true, then increase the difficulty.
        /
        /   e.g. If the mine rate is 3000ms but the timestamp 
        /   occured <3000ms ago, then the difficulty was too easy.
        */
        let { difficulty } = lastBlock;

        difficulty = lastBlock.timestamp + MINE_RATE > currentTime 
                        ? difficulty + 1 : difficulty - 1;

        return difficulty;
    }
}

module.exports = Block;