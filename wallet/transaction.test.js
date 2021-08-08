// Test transactions
const Transaction = require('./transaction');
const Wallet = require('./index');
const { MINING_REWARD } = require('../config');

describe('Transaction', () => {
    let transaction, wallet, recipient, amount;

    beforeEach(() => {
        wallet = new Wallet();
        amount = 50;
        recipient = 'test-recipient';
        transaction = Transaction.newTransaction(wallet,recipient,amount);
    });

    it('outputs the `amount` subtracted from the wallet balance',
        () => {
            expect(transaction.outputs.find(
                    output => output.address === wallet.publicKey
                ).amount
            ).toEqual(wallet.balance - amount);
        }
    );

    it('outputs the `amount` added to the recipient amount',
        () => {
            expect(transaction.outputs.find(
                    output => output.address === recipient
                ).amount
            ).toEqual(amount);
        }
    );

    it('inputs the balance of the wallet',
        () => {
            expect(transaction.input.amount).toEqual(wallet.balance);
        }
    );
    
    describe('transacting with an amount exceeding the balance',
        () => {
            beforeEach(() => {
                    amount = 50000;
                    transaction = Transaction.newTransaction(wallet, recipient, amount);
                }
            );

            it('does not create the transaction if amount exceeds balance',
                () => {
                    expect(transaction).toEqual(undefined);
                }
            );
        }
    );

    it('validates a valid transaction',
        () => {
            expect(
                Transaction
                .verifyTransaction(transaction)
            )
            .toBe(true);
        }
    );

    it('invalidates a corrupt transaction',
        () => {
            transaction.outputs[0].amount = 50000; // Corrupt amount
            expect(
                Transaction
                .verifyTransaction(transaction)
            )
            .toBe(false);
        }
    );

    describe('and updating a transaction',
        () => {
            let nextAmount, nextRecipient;
            beforeEach(() => {
                nextAmount = 20;
                nextRecipient = 'n3xt-4ddr355';
                transaction = transaction.update(wallet, nextRecipient, nextAmount);
            });

            it(`subtracts the next amount from the sender's output`,
                () => {
                    expect(
                        transaction.outputs
                        .find(
                            output => output.address === wallet.publicKey
                        ).amount
                    )
                    .toEqual(wallet.balance - amount - nextAmount);
                }
            );

            it('outputs an amount for the next recipient',
                () => {
                    expect(
                        transaction.outputs.find(
                            output => output.address === nextRecipient
                        ).amount
                    )
                    .toEqual(nextAmount);
                }
            );
        }
    );

    describe('creating a reward transaction', () => {
        beforeEach(() => {
            transaction = Transaction.rewardTransaction(wallet, Wallet.blockchainWallet());
        });

        it(`reward the miner's wallet`,
            () => {
                expect(
                    transaction.outputs
                    .find(
                        output => output.address === wallet.publicKey
                    ).amount
                )
                .toEqual(MINING_REWARD);
            }
        );
    });
});