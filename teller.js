const ethc = require('eth-crypto');
const net = require('net')
const jsonStream = require('duplex-json-stream')

const client = jsonStream(net.connect(3876))
const argv = process.argv.slice(2)

let idc = argv[2]; 
let command = argv[0];
let privKey = argv[3];
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function (search, pos) {
      pos = !pos || pos < 0 ? 0 : +pos;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}
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
    client.end({
      id : idc,
      msg : msg,
      msghash : msghash,
      sig : ethc.sign(
        privKey,
        ethc
      )
    })
    break

  case 'balance':
    client.end({id: id, cmd: 'balance'})
    break
  case 'withdraw':
    amount = parseFloat(argv[2]);
    client.end({id: id, cmd: 'withdraw', amount: amount});
    break

  case 'help':
  default:
    console.log('node register [ID] or if you have id,');
    console.log('node teller.js [ID] [CMD] [PRIVATE KEY]');
    console.log('Private key is used to sign transactions');
}
