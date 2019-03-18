const ethc = require('eth-crypto');
const argv = process.argv.slice(2)

id = argv[0]
message = argv[1]
signature = argv[2]

const signer = ethc.recover(
      signature,
      ethc.hash.keccak256(message)
);


if(signer == id){
	console.log("Good, this signature is VERIFIED")
}
else{
	console.log("BAD signature")
}


