const express = require('express');
const app = express();
const bodyparser = require('body-parser'); 
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const bitcoin = new Blockchain();

const nodeAddress = uuid().split('-').join('');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}))

app.get('/blockchain', function (req, res) {
  res.send(bitcoin.chain);
})

app.get('/transaction', function (req, res) {
  const blockindex = bitcoin.creatNewTransaction(req.body.amount, req.body.sender , req.body.recipient);
  res.json({note: `Transaction will be added to block ${blockindex}`});
})

app.get('/mine', function (req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.transactions,
        index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.POW(previousBlockHash, currentBlockData );
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock = bitcoin.creatNewBlock(nonce, previousBlockHash, blockHash);
    bitcoin.creatNewTransaction(12.5, '00', nodeAddress);
    res.json({note: "New block mined successfully!",
             block: newBlock       });

})
 
app.listen(3000, function(){
    console.log("listening on port 3000....")
})
