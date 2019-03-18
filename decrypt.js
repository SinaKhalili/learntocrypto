const sodium = require('sodium-native');


let argv = process.argv.slice(2);
let key = Buffer.from(argv[1], 'hex');
let nonce = Buffer.from(argv[2], 'hex');
let ciphertext = Buffer.from(argv[0], 'hex');

let plainText = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES)
if (!sodium.crypto_secretbox_open_easy(plainText, ciphertext, nonce, key)) {
  console.log('Decryption failed!')
} else {
  console.log('Decrypted message:', plainText, '(' + plainText.toString() + ')')
}
