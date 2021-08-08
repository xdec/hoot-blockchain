const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');
const { INITIAL_BALANCE } = require('../config'); // Starter balance

// Wallet Creator
class Wallet {
    constructor() {
        this.balance = INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    toString() {
        return `Wallet - 
            publicKey:      ${this.publicKey.toString()}
            balance:        ${this.balance}
        `
    }

    // Sign data
    sign(dataHash) {
        return this.keyPair.sign(dataHash);
    }

    // Create transactions
    createTransaction(recipient, amount, blockchain, transactionPool) {
        // Calculate the balance
        this.balance = this.calculateBalance(blockchain);

        // Don't create transaction if amount exceeds sender balance
        if(amount > this.balance) {
            console.log(`Amount: ${amount} exceeds curren balance: ${this.balance}`);
            return;
        }
        // Check if the transaction exist for this wallet in the pool
        let transaction = transactionPool.existingTransaction(this.publicKey);

        if(transaction) {
            // Update transaction
            transaction.update(this, recipient, amount);
        } else {
            // Create new transaction
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.updateOrAddTransaction(transaction);
        }

        return transaction;
    }

    // Calculate the balance of the wallet
    calculateBalance(blockchain) {
        let balance = this.balance;
        let transactions = [];

        blockchain.chain.forEach(
            block => block.data.forEach(
                transaction => {
                    transactions.push(transaction);
                }
            )
        );

        const walletInputTs = transactions.filter(
            transaction => transaction.input.address === this.publicKey
        ); // Wallet Transactions

        let startTime = 0;

        if(walletInputTs.length > 0) { // Make sure the array has contents within, otherwise reduce will not work
            const recentInputT = walletInputTs.reduce(
                (prev, current) => prev.input.timestamp > current.input.timestamp ? prev : current
            );

            balance = recentInputT.outputs.find(
                output => output.address === this.publicKey
            ).amount;

            startTime = recentInputT.input.timestamp; // Modify `startTime` for transaction checks
        }

        // Check if these transactions were generated after recent input
        transactions.forEach(transaction => {
            if(transaction.input.timestamp > startTime) {
                transaction.outputs.find(
                    output => {
                        if(output.address === this.publicKey) {
                            balance += output.amount;
                        }
                    }
                )
            }
        });

        return balance;
    }

    // Blockchain wallet to approve reward transactions
    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.address = 'blockchain-wallet';
        return blockchainWallet;
    }
}

module.exports = Wallet;