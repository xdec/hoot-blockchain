const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256'); // Generate unique hash
const { v1: uuidV1 } = require('uuid');
const ec = new EC('secp256k1'); // Standard Of Efficient Cryptography | Prime | 256 Bits

// Chain Utilities
class ChainUtil {
    // Create Keys
    static genKeyPair() {
        /*
        /   Get the public and private key created
        /   in this key pair.
        /
        /   We can use a sign method to generate a
        /   signature based on given data.
        */
        return ec.genKeyPair();
    }

    // Create Unique ID
    static id() {
        return uuidV1();
    }

    // Hash any incoming data
    static hash(data) {
        return SHA256(JSON.stringify(data)).toString();
    }

    // Verify signatures
    static verifySignature(publicKey, signature, dataHash) {
        return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
    }
}

module.exports = ChainUtil;