const EthCrypto = require('eth-crypto')

let message = 'Hello, World!'

let hash = EthCrypto.hash.keccak256(message)

console.log("Original message: %s \nkeccak hash: %s", message, hash);
