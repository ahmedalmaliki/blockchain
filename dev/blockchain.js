const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

function Blockchain (){
    let chain = [];
    let pendingTransactions = [];
    let timeNeeded = 20160;
    let old_diff = 4;
    let diff = old_diff * (20160 / timeNeeded );
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    Object.defineProperty(this, 'diff', {
        get: function(){
            return diff;
        }

    });
    Object.defineProperty(this, 'chain', {
        get: function(){
            return chain;
        },
        set: function(newChain){
            chain = newChain;
        }

    });
    Object.defineProperty(this, 'pendingTransactions', {
        get: function(){
            return pendingTransactions;
        },
        set : function(newPendingTransactions){
            pendingTransactions = newPendingTransactions;
        }
       
    });

    
    this.chainLength = function(){
        return chain.length;
    }
    this.pushNewBlock = function(block){
        chain.push(block);
    }

    this.emptyPendingTransactions = function(){
        pendingTransactions = [];
    }
    this.createNewBlock = function(nounce, previousBlockHash, hash){
        const newBlock = new Block(nounce, previousBlockHash, hash, this.pendingTransactions,
             this.chainLength() + 1 , Date.now())
       
       this.emptyPendingTransactions();
       this.pushNewBlock(newBlock); 
    
        return newBlock;
    }

    this.getLastBlock = function(){
        return chain[this.chainLength() - 1];
    }
    this.createNewTransaction = function(amount, sender, recipient){
        const newTransaction = new Transaction(amount, sender, recipient);
        return newTransaction;
       
    } 
    this.addTransactionToPendingTransactions = function(transactionObj){
        pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    }
    this.hashBlock = function(previousBlockHash, currentBlockData, nonce){
        const dataAsStaring = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsStaring);
        return hash;
    }
    this.getBlockchain = function(){
        return {
            chain: chain,
            pendingTransactions: pendingTransactions,
            networkNodes: this.networkNodes,
            chainLength : chain.length
        };
    }

    this.createNewBlock(21,'0','0');

}


// Proof Of Wow...

Blockchain.prototype.POW = function(previousBlockHash, currentBlockData){
   
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    let numberOfZeros = '0'.repeat(this.diff);
    while(hash.substring(0, this.diff) !== numberOfZeros){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
	let validChain = true;

	for (var i = 1; i < this.chainLength; i++) {
		const currentBlock = this.chain[1];
		const prevBlock = this.chain[i - 1];
		const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
		if (blockHash.substring(0, this.diff) !== '0'.repeat(this.diff)) validChain = false;
		if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
	};

	const genesisBlock = this.chain[0];
	const correctNonce = genesisBlock['nonce'] === 21;
	const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
	const correctHash = genesisBlock['hash'] === '0';
	const correctTransactions = genesisBlock['transactions'].length === 0;

	if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

	return validChain;
};


function Block(nonce, previousBlockHash, hash, transactions, index, timeStamp){
    this.nonce = nonce;
    this.previousBlockHash = previousBlockHash;
    this.hash = hash;
    this.transactions = transactions;
    this.index = index;
    this.timeStamp = timeStamp;



}




function Transaction(amount, sender, recipient){
    this.amount =  amount,
    this.sender =  sender,
    this.recipient = recipient,
    this.transactionId = uuid().split('-').join('');

}



module.exports= Blockchain;
