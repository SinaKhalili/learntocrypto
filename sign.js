const ethc = require('eth-crypto');
const argv = process.argv.slice(2)
const identity = ethc.createIdentity();


//sign()
//Signs the hash with the privateKey. Returns the signature as hex-string.
const message = argv[0]
const messageHash = ethc.hash.keccak256(message);
const signature = ethc.sign(
      identity.privateKey,
      messageHash // hash of message
);

console.log("Generated signature : " +  signature)
console.log("Use this command on node :")
console.log("node verify.js " + identity.address + " " + message + " " + signature)

