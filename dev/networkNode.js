const express = require('express');
const app = express();
const bodyparser = require('body-parser'); 
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const bitcoin = new Blockchain();
const port = process.argv[2];
const nodeAddress = uuid().split('-').join('');
const rp = require('request-promise');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}))

app.get('/blockchain', function (req, res) {
  res.send(bitcoin.getBlockchain());
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

app.post('/register-and-brodcast-node', function(req, res){
  const newNodeUrl = req.body.newNodeUrl;
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)bitcoin.networkNodes.push(newNodeUrl);
  const regNodesPromises = [];
  bitcoin.networkNodes.forEach(netWorkNodeUrl => {
    const requestOptions = {
      uri: netWorkNodeUrl + '/register-node',
      method: 'POST',
      body: {newNodeUrl: newNodeUrl},
      json: true
    }
    regNodesPromises.push(rp(requestOptions));


  });

  Promise.all(regNodesPromises).then(data => {
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/register-node-bulk',
      method: 'POST',
      body: {allNetworkNodes : [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
      json: true
    }
    return rp(bulkRegisterOptions);

  })
  .then(data => {
    res.json({note: 'New node registered with network successfuly'});
  });


});

app.post('/register-node', function(req, res){
  const newNodeUrl = req.body.newNodeUrl;
  const notAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (notAlreadyPresent && notCurrentNode ) bitcoin.networkNodes.push(newNodeUrl);
  res.json({note: 'New node registered successfuly'});
  
});
 
app.post('/register-node-bulk', function(req, res){
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(netWorkNodeUrl =>{
    const notAlreadyPresent = bitcoin.networkNodes.indexOf(netWorkNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== netWorkNodeUrl;
    if (notAlreadyPresent && notCurrentNode )bitcoin.networkNodes.push(netWorkNodeUrl);
  });
  res.json({note: "Bulk registration is complete"});
}); 

app.listen(port, function(){
    console.log(`listening on port ${port}....`);
})
