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
});

app.get('/chain', function(req, res){
	res.send(bitcoin.chain);
});

app.post('/transaction', function(req, res) {
	const newTransaction = req.body;
	const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
	res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

// broadcast transaction
app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	bitcoin.addTransactionToPendingTransactions(newTransaction);

	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'Transaction created and broadcast successfully.' });
	});
});

app.get('/mine', function(req, res) {
	const lastBlock = bitcoin.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: bitcoin.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const nonce = bitcoin.POW(previousBlockHash, currentBlockData);
	const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
	const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receive-new-block',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
			method: 'POST',
			body: {
				amount: 12.5,
				sender: "00",
				recipient: nodeAddress
			},
			json: true
		};

		return rp(requestOptions);
	})
	.then(data => {
		res.json({
			note: "New block mined & broadcast successfully",
			block: newBlock
		});
	});
});


// receive new block
app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = bitcoin.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash; 
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		bitcoin.pushNewBlock(newBlock);
		bitcoin.emptyPendingTransactions();
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
});

app.post('/register-and-brodcast-node', function(req, res){
  const newNodeUrl = req.body.newNodeUrl;
  const notAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (notAlreadyPresent && notCurrentNode){
	  bitcoin.networkNodes.push(newNodeUrl);
	}else{
		res.json({note: 'Node was not added!'});
	}

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


// consensus
app.get('/consensus', function(req, res) {
	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = bitcoin.chainLength();
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chainLength > maxChainLength) {
				maxChainLength = blockchain.chainLength;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});


		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			});
		}
		else {
			bitcoin.chain = newLongestChain;
			bitcoin.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: bitcoin.chain
			});
		}
	});
});

app.listen(port, function(){
    console.log(`listening on port ${port}....`);
})



