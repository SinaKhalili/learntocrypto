const ethc = require('eth-crypto');
const jsonStream = require('duplex-json-stream');
const net = require('net');

const client = jsonStream(net.connect(3876))
const argv = process.argv.slice(2)

let idc = argv[2]; 
let command = argv[0];
let privKey = argv[3];

client.on('data', function (msg) {
  console.log('Teller received:', msg);
});

switch (command) {
  case 'register':
    console.log("Creating new public/private address");
    let id = ethc.createIdentity();
    console.log('Your info (save this or something)');
    console.log(id);
    console.log("Your address will be used as your id");
    client.end({ id: id.address, msg : { cmd: 'register'} });
    break
  case 'deposit':
    let amount = parseFloat(argv[1]);
    let msg =  { id: idc, cmd: 'deposit', amount: amount };
    let msghash = ethc.hash.keccak256(JSON.stringify(msg));
    signature = ethc.sign(
      privKey,
      msghash 
    )
    client.end({
      id : idc,
      msg : msg,
      msghash : msghash,
      sig : signature
    })
    break

  case 'balance':
    idc = argv[1];
    privKey = argv[2];
    let msgc = { id: idc, cmd: 'balance' };
    let msghashc = ethc.hash.keccak256(JSON.stringify(msgc));
    signature = ethc.sign(
      privKey,
      msghashc
    )
    client.end({
      id: idc,
      msg: msgc,
      msghash: msghashc,
      sig: signature
    })
    break
  case 'withdraw':
    let amountw = parseFloat(argv[1]);
    let msgw = { id: idc, cmd: 'withdraw', amount: amountw };
    let msghashw = ethc.hash.keccak256(JSON.stringify(msgw));
    signature = ethc.sign(
      privKey,
      msghashw
    )
    client.end({
      id: idc,
      msg: msgw,
      msghash: msghashw,
      sig: signature
    })
    break

  case 'help':
  default:
    console.log('node register or if you have id,');
    console.log('node teller.js [CMD] [ID] [PRIVATE KEY]');
    console.log('Private key is used to sign transactions');
}
