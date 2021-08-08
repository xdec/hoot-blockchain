const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

// Create Miner
class Miner {
    constructor(blockchain, transactionPool, wallet, p2pServer) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.p2pServer = p2pServer;
    }

    // Handle mining
    /*
    /   Grab transactions from the pool and create a block
    /   with data consisting of the transactions. Then sync 
    /   the chains across the network with the new block.
    /
    /   Then clear the transaction pool of all transactions.
    /   Because they're now part of the blockchain.
    */
    mine() {
        // Get valid transactions
        const validTransactions = this.transactionPool.validTransactions();
        
        // Incentivise miners with a reward
        validTransactions.push(
            Transaction.rewardTransaction(this.wallet, Wallet.blockchainWallet())
        );

        // Add a block with the valid transactions
        const block = this.blockchain.addBlock(validTransactions);

        // Synchronize chains
        this.p2pServer.syncChains();

        // Clear transaction pool
        this.transactionPool.clear();
        
        // Broadcast a transaction pool clear request to the network
        this.p2pServer.broadcastClearTransactions();

        return block;
    }
}

module.exports = Miner;