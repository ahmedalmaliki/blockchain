const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();


const chain = [{"nonce":21,"previousBlockHash":"0","hash":"0","transactions":[],"index":1,"timeStamp":1621957618214},{"nonce":1750878,"previousBlockHash":"0","hash":"000007ae52c06a40d6ddf643cc82ceb9215f51a22f811b1f216397d2afd1d1ac","transactions":[{"amount":10,"sender":"hsjgdywetr67w53t2wjdfweftd236r","transactionId":"753bc410bd7011eba0a7d59e007bda9e"}],"index":2,"timeStamp":1621957636862},{"nonce":1001421,"previousBlockHash":"000007ae52c06a40d6ddf643cc82ceb9215f51a22f811b1f216397d2afd1d1ac","hash":"000003adcba3fad5c1faf7dd3751642ddedc9a0584bec153b50837705c2b9d03","transactions":[{"amount":12.5,"sender":"00","recipient":"703fac60bd7011eba0a7d59e007bda9e","transactionId":"7b5ecf90bd7011eba0a7d59e007bda9e"},{"amount":20,"sender":"hsjgdywetr67w53t2wjdfweftd236r","transactionId":"835ba420bd7011eba0a7d59e007bda9e"}],"index":3,"timeStamp":1621957658319}];
console.log(bitcoin.getBlockchain());
console.log('Valid: ',bitcoin.chainIsValid(chain));