const Transaction = require('../wallet/transaction');

// Transaction Pool
class TransactionPool {
    constructor() {
        this.transactions = [];
    }

    // Add incoming transactions to `transactions` array
    updateOrAddTransaction(transaction) {
        // Replace transaction if exists with same ID and input
        let transactionWithId = this.transactions.find(
            t => t.id === transaction.id
        ); // Transactions must be identical OR undefined

        if(transactionWithId) {
            this.transactions[this.transactions.indexOf(transactionWithId)] = transaction; // Replace existing transaction
        } else {
            // Transaction doesn't exist
            this.transactions.push(transaction);
        }
    }

    // Handle existing transactions
    existingTransaction(address) {
        return this.transactions.find(
            t => t.input.address === address
        ); // Either returns an object OR `undefined`
    }

    // Validate transactions
    validTransactions() {
        return this.transactions.filter(
            transaction => {
                const outputTotal = transaction.outputs.reduce(
                    (total, output) => {
                        return total + output.amount;
                    }, 
                    0 // Initializes total to 0 at the beginning
                );

                // Verify amount
                if(transaction.input.amount != outputTotal) {
                    console.log(`Invalid transaction from ${transaction.input.address}`);
                    return;
                }

                // Verify signatures
                if(!Transaction.verifyTransaction(transaction)) {
                    console.log(`Invalid signature from ${transaction.input.address}`);
                    return;
                }

                return transaction;
            }
        );
    }

    // Empty the transactions array
    clear() {
        this.transactions = [];
    }
}

module.exports = TransactionPool;