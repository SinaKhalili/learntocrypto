

const ethc = require('eth-crypto');
const fs = require('fs');
const jsonStream = require('duplex-json-stream');
const net = require('net');

let log;
let bankidentity;

try {
    bankidentity = require('./bankidentity.json');
} catch (ex) {
    let identity = ethc.createIdentity();
    fs.writeFileSync('./bankidentity.json', JSON.stringify(identity, null, '\t') , 'utf-8'); 
    console.log("bankidentity.json not found, created bank key.");
    bankidentity = identity;
}

try {
    log = require('./log.json');
} catch (ex) {
    let nlog = []
    fs.writeFileSync('./log.json', JSON.stringify(log, null, '\t') , 'utf-8'); 
    console.log("log.json not found, created empty log.");
    log = [];
  }


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
    switch (msg.cmd) {
      case 'balance':
        socket.end({cmd: 'balance', balance: log.reduce(reduceLog, 0)});
      break
      case 'deposit':
        appendToTransactionLog(msg);
    	  fs.writeFileSync('./log.json', JSON.stringify(log, null, '\t') , 'utf-8'); 
        socket.end({cmd: 'balance', balance: log.reduce(reduceLog, 0)});
      break
      case 'withdraw': 
        if(msg.amount <= log.reduce(reduceLog, 0)){
              appendToTransactionLog(msg);
              fs.writeFileSync('./log.json', JSON.stringify(log, null, '\t') , 'utf-8'); 
              socket.end({cmd: 'balance', balance: log.reduce(reduceLog, 0)});
            }
        else{
          socket.end({cmd: 'withdrawl refused', balance: log.reduce(reduceLog, 0)});
        }
      break
      default:
        socket.end({cmd: 'error', msg: 'Unknown command'});
      break
    }
  })
})

server.listen(3876)
console.log("Bank Online")

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
    signature : sig,
    value: entry,
    hash: msghash});
}
