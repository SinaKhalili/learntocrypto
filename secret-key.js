const sodium = require('sodium-native');

let key = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES)
sodium.randombytes_buf(key)
console.log("copy paste as hex")
console.log(key.toString('hex'))
