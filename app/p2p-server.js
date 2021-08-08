const Websocket = require('ws');

// Default port
const P2P_PORT = process.env.P2P_PORT || 5001; // User defined or default
const peers = process.env.PEERS ? process.env.PEERS.split(',') : []; // Split into array containing the specified variables or create empty array

// Message types
const MESSAGE_TYPES = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION',
    clear_transactions: 'CLEAR_TRANSACTIONS'
};

// Create server
class P2pServer {
    constructor(blockchain, transactionPool) {
        // Let servers share their chain objects with each other
        this.blockchain = blockchain;
        // Transaction Pool
        this.transactionPool = transactionPool;
        // List of connected servers
        this.sockets = [];
    }

    // Start server
    listen() {
        const server = new Websocket.Server({ port: P2P_PORT });
        // Listen for new connections and push socket to array of sockets with connectSocket
        server.on('connection', socket => this.connectSocket(socket));
        console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
    
        // Connect to peers that are specified when started
        this.connectToPeers();
    }

    // Push socket to array of sockets
    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');
        
        // Message handler
        this.messageHandler(socket);

        // Send the chain
        this.sendChain(socket);
    }

    // Connect to peers
    connectToPeers() {
        peers.forEach(peer => {
            // ws://localhost:5001
            const socket = new Websocket(peer);

            // Open a new event listener in case server is started later
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    // Message handler to send blockchain relevant data
    messageHandler(socket) {
        // Event listener for messages
        socket.on('message', message => {
            const data = JSON.parse(message); // Stringified data
        
            // Switch based on the incoming `data` type
            switch(data.type) {
                case MESSAGE_TYPES.chain:
                    // Sync blockchains across network
                    this.blockchain.replaceChain(data.chain); // Replace blockchain with incoming data from incoming peer
                    break;
                case MESSAGE_TYPES.transaction:
                    // Keep network transaction pool up to date
                    this.transactionPool.updateOrAddTransaction(data.transaction); // Update or Create a transaction based on the incoming data from incoming peer
                    break;
                case MESSAGE_TYPES.clear_transactions:
                    this.transactionPool.clear();
                    break;
            }
        });
    }

    // Take socket and log what's currently being done in connectSocket
    sendChain(socket) {
        socket.send(
            JSON.stringify(
                {
                    type: MESSAGE_TYPES.chain, 
                    chain: this.blockchain.chain 
                }
            )
        ); // Send the chain
    }

    // Sync updated blockchain across all peers
    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket)); // Replace chain with own chain
    }

    // Send transactions
    sendTransaction(socket, transaction) {
        socket.send(
            JSON.stringify(
                {
                    type: MESSAGE_TYPES.transaction,
                    transaction
                }
            )
        );
    }

    // Broadcast transactions across the network
    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => this.sendTransaction(socket, transaction));
    }

    // Broadcast clear transactions instruction to network
    broadcastClearTransactions() {
        this.sockets.forEach(
            socket => socket.send(JSON.stringify({
                type: MESSAGE_TYPES.clear_transactions
            }))
        );
    }
}

module.exports = P2pServer;