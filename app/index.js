const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain');
const P2pServer = require('./p2p-server');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const Miner = require('./miner');

// Create API
const HTTP_PORT = process.env.HTTP_PORT || 3001; // API port specified by user or default.

// Build App
const app = express();
const bc = new Blockchain();

// Create wallet
const wallet = new Wallet();

// Create Transaction Pool
const tp = new TransactionPool();

// Create new P2pServer
const p2pServer = new P2pServer(bc, tp);

// Create Miner
const miner = new Miner(bc, tp, wallet, p2pServer);

// Receive requests
app.use(bodyParser.json())

// Blocks GET endpoint
app.get('/blocks', 
    // Send all the blocks in the blockchain
    (req, res) => {
        res.json(bc.chain);
    }
);

// Mine Blocks POST endpoint
app.post('/mine', 
    (req, res) => {
        // Add new block using the users request
        const block = bc.addBlock(req.body.data);

        // Notify user block has been added
        console.log(`New block added: ${block.toString()}`);

        p2pServer.syncChains(); // Sync chains across network for each new block
        
        res.redirect('/blocks'); // Show the updated blockchain
    }
);

// Transactions GET endpoint
app.get('/transactions', (req, res) => {
    res.json(tp.transactions);
});

// Create Transaction POST endpoint
app.post('/transact', (req, res) => {
    const { recipient, amount } = req.body;
    const transaction = wallet.createTransaction(recipient, amount, bc, tp);
    
    p2pServer.broadcastTransaction(transaction); // Broadcast new transaction across network
    res.redirect('/transactions');
});

// Mine Transactions GET endpoint
app.get('/mine-transactions', (req, res) => {
    const block = miner.mine();
    console.log(`New block added: ${block.toString()}`);
    res.redirect('/blocks');
});

// Expose a users own public address so they can share it with other users
app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey });
});

// API Listener
app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
// Start websocket server
p2pServer.listen();