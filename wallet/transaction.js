const ChainUtil = require('../chain-util');
const { MINING_REWARD } = require('../config');

// Create Transactions
class Transaction {
    constructor() {
        this.id = ChainUtil.id();
        this.input = null;
        this.outputs = [];
    }

    // Update transactions
    update(senderWallet, recipient, amount) {
        const senderOutput = this.outputs.find(
            output => output.address === senderWallet.publicKey
        );
        // Check if send amount exceeds sender wallet balance
        if(amount > senderOutput.amount) {
            console.log(`Amount: ${amount} exceeds balance.`);
            return;
        }

        // Update balance
        senderOutput.amount = senderOutput.amount - amount;
        this.outputs.push({ amount, address: recipient });
        Transaction.signTransaction(this, senderWallet); // Resign transaction

        return this;
    }

    // Helper for new transaction and rewards
    static transactionWithOutputs(senderWallet, outputs) {
        const transaction = new this(); // Create a new Transaction

        transaction.outputs.push(...outputs);
        Transaction.signTransaction(transaction, senderWallet);

        return transaction;
    }

    // Reward transaction
    static rewardTransaction(minerWallet, blockchainWallet) {
        return Transaction.transactionWithOutputs(
            blockchainWallet,
            [
                {
                    amount: MINING_REWARD,
                    address: minerWallet.publicKey
                }
            ]
        );
    }

    // New Transactions
    static newTransaction(senderWallet, recipient, amount) {
        const transaction = new this(); // Create a new Transaction

        // Check if the given amount exceeds the senders balance
        if(amount > senderWallet.balance) {
            console.log(`Amount: ${amount} exceeds balance.`)
            return;
        }

        return Transaction.transactionWithOutputs(
            senderWallet,
            [
                {
                    amount: senderWallet.balance - amount,
                    address: senderWallet.publicKey
                },
                {
                    amount, // ES6 allows us to declare one var for KP value if they are exactly the same
                    address: recipient
                }
            ]
        );
    }

    // Sign transactions
    static signTransaction(transaction, senderWallet) {
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.hash(transaction.outputs))
        }
    }

    // Verify transaction
    static verifyTransaction(transaction) {
        return ChainUtil.verifySignature(
            transaction.input.address,
            transaction.input.signature,
            ChainUtil.hash(transaction.outputs)
        );
    }
}

module.exports = Transaction;