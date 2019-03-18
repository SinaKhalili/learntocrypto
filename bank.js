const ethc = require('eth-crypto');
const fs = require('fs');
const jsonStream = require('duplex-json-stream');
const net = require('net');
const sodium = require('sodium-native');

let log;
let bankidentity;
let key;


// --- Begin trying to grab json files for keys and log --------
try {
    keyfile = require('./key.json');
    key = Buffer.from(keyfile.key, 'hex');
} catch (ex) {
    let symmetric_key = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES) ; 
    sodium.randombytes_buf(symmetric_key);
    fs.writeFileSync('./key.json', JSON.stringify({key: symmetric_key.toString('hex')}), null, '\t' , 'utf-8'); 
    console.log("key.json not found, created symmetric key.");
    key = symmetric_key;
}
try {
    bankidentity = require('./bankidentity.json');
} catch (ex) {
    let identity = ethc.createIdentity();
    fs.writeFileSync('./bankidentity.json', JSON.stringify(identity, null, '\t') , 'utf-8'); 
    console.log("bankidentity.json not found, created bank key.");
    bankidentity = identity;
}
try {
    logfile = require('./log.json');
    let plainTextLog = Buffer.alloc(logfile.logcipher.length - sodium.crypto_secretbox_MACBYTES);
    let ciphertext = Buffer.from(logfile.logcipher, 'hex');
    let nonce = Buffer.from(logfile.nonce, 'hex');
	if (!sodium.crypto_secretbox_open_easy(plainTextLog, ciphertext, nonce, key)) {
	  console.log('Decryption failed!');
	  return;
	} 
	else {
		console.log('Decryption succeeded');
		log = JSON.parse(plainTextLog.toString().split('\n]')[0] + '\n]');
	}

} catch (ex) {
    let nlog = []
    fs.writeFileSync('./log.json', JSON.stringify(log, null, '\t') , 'utf-8'); 
    console.log("log.json not found, created empty log.");
    log = [];
}
// ---------------- End looking for files --------------------------

const genesishash = Buffer.alloc(13).toString();

console.log("Checking log integrity...");
if (
  log.length &&
  (log.reduce(reduceHash, genesishash) != log[log.length - 1].hash || log.some(badSignature))
   ) {
  console.log("Log tampering detected");
  return;
}
else{
  console.log("PASSED");
}
const server = net.createServer(function (socket) {
  socket = jsonStream(socket);
  socket.on('data', function (msg) {
    console.log('Bank received:', msg)

    switch (msg.msg.cmd) {
      case 'register':
        console.log("Registering new customer!");
        console.log("Welcome to the bank");
        if (log.filter(e => e.id == msg.id).length == 0){
          console.log("Your address is a valid address");
          appendToTransactionLog(msg.msg)
          writeFileToDisk();
          socket.end({ cmd: 'registration success' });
        }
        else{
          socket.end({ cmd: 'address already in use' });
        }
      break
      case 'balance':
        if (!verifyTeller(msg)) { socket.end({ cmd: 'bad signature' }); break;};
        socket.end({cmd: 'balance', balance: log.filter(e => e.id == msg.id).reduce(reduceLog, 0)});
      break
      case 'deposit':
        if (!verifyTeller(msg)) { socket.end({cmd:'bad signature'}); break;};
        appendToTransactionLog(msg.msg);
	      writeFileToDisk();
        socket.end({cmd: 'balance', balance: log.filter(e => e.id == msg.id).reduce(reduceLog, 0)});
      break
      case 'withdraw': 
        if (!verifyTeller(msg)) { socket.end({ cmd: 'bad signature' }); break; };
        if(msg.msg.amount <= log.filter(e => e.id == msg.id).reduce(reduceLog, 0)){
              appendToTransactionLog(msg.msg);
              writeFileToDisk();
          socket.end({ cmd: 'balance', balance: log.filter(e => e.id == msg.id).reduce(reduceLog, 0)});
            }
        else{
          socket.end({cmd: 'withdrawl refused', balance: log.filter(e => e.id == msg.id).reduce(reduceLog, 0)})
        }
      break
      default:
        socket.end({cmd: 'error', msg: 'Unknown command'});
      break
    }
    // console.log(log)
  })
})

server.listen(3876)
console.log("Bank Online")

function writeFileToDisk(){
	let message = Buffer.from(JSON.stringify(log, null, '\t'));
	let ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);
	let nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES);
	sodium.randombytes_buf(nonce) 
	sodium.crypto_secretbox_easy(ciphertext, message, nonce, key)
	fs.writeFileSync('./log.json', JSON.stringify(
		{
			logcipher : ciphertext.toString('hex'),
			nonce : nonce.toString('hex')
		}, null, '\t') , 'utf-8'); 
}

function badSignature(entry){
	let signer;
	try{
	signer =	ethc.recover(
		entry.signature,
		entry.hash
	);}
	catch(ex){
		return true
	}

	if(signer != bankidentity.address){
		return true
	}
	return false;
}

function verifyTeller(entry){
  let signer;
  signer = ethc.recover(
    entry.sig,
    entry.msghash
  );
  return signer == entry.id;
}
function reduceHash (prevHash, logVal) {
  return ethc.hash.keccak256( prevHash + JSON.stringify(logVal.value));
}

function reduceLog (balance, entry) {
  if(entry.value.cmd == 'deposit'){
  	return balance + entry.value.amount;
  }
  else if(entry.value.cmd == 'withdraw'){
	return balance - entry.value.amount;
  }
}

function appendToTransactionLog (entry) {
  let prevHash = log.length ? log[log.length - 1].hash : genesishash;

  let msghash =  ethc.hash.keccak256(prevHash + JSON.stringify(entry));
  let sig = ethc.sign(
      bankidentity.privateKey,
      msghash);

  log.push({
    id: entry.id,
    signature : sig,
    value: entry,
    hash: msghash});
}
