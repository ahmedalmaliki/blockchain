const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];

function Blockchain (){
    let chain = [];
    let newTransactions = [];
    let timeNeeded = 20160;
    let old_diff = 5;
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
        }

    });
    Object.defineProperty(this, 'newTransactions', {
        get: function(){
            return newTransactions;
        }
       
    });

    let pushNewTransaction = function(transaction){
        newTransactions.push(transaction);
    }
    this.chainLength = function(){
        return chain.length;
    }
    let pushNewBlock = function(block){
        chain.push(block);
    }

    let emptyNewTransactions = function(){
        newTransactions = [];
    }
    this.creatNewBlock = function(nounce, previousBlockHash, hash){
        const newBlock = new Block(nounce, previousBlockHash, hash, this.newTransactions,
             this.chainLength() + 1 , Date.now())
       
       emptyNewTransactions();
       pushNewBlock(newBlock); 
    
        return newBlock;
    }

    this.getLastBlock = function(){
        return chain[this.chainLength() - 1];
    }
    this.creatNewTransaction = function(amount, sender, recipient){
        const newTransaction = new Transaction(amount, sender, recipient);
        pushNewTransaction(newTransaction); 
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
            newTransactions: newTransactions,
            networkNodes: this.networkNodes
        };
    }

    this.creatNewBlock(21,'0','0');

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
    return hash;
}

function Block(nounce, previousBlockHash, hash, newTransactions, index, timeStamp){
    this.nounce = nounce;
    this.previousBlockHash = previousBlockHash;
    this.hash = hash;
    this.newTransactions = newTransactions;
    this.index = index;
    this.timeStamp = timeStamp;



}




function Transaction(amount, sender, recipient){
    this.amount =  amount,
    this.sender =  sender,
    this.recipient = recipient

}



module.exports= Blockchain;
