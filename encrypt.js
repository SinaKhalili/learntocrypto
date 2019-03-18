const sodium = require('sodium-native')

let nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES);
sodium.randombytes_buf(nonce);

let argv = process.argv.slice(2);

let key = Buffer.from(argv[1], 'hex');
let message = Buffer.from(argv[0]);
let ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);

sodium.crypto_secretbox_easy(ciphertext, message, nonce, key);

console.log('Nonce : ');
console.log(nonce.toString('hex'));
console.log('Encrypted message: ');
console.log(ciphertext.toString('hex'));
