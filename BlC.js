const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const myKey = ec.keyFromPrivate('c6655df0e4c4eea54bb0007a469d5a4d011472e2a6297c8d8be46b92d5b23311');

class Transaction
{
    constructor(fromAddress, toAddress, amount)
    {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();  
    }
    
    calculateHash() 
    {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp)
          .toString();
    }
    signTransaction(signingKey) 
    {
        
        if (signingKey.getPublic('hex') != this.fromAddress)
        throw new Error('no transactions for other wallets');
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }
 
    isValid() 
    {
        if (this.fromAddress == null) return true;
        if (!this.signature || this.signature.length == 0)
        throw new Error('no sign');
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
      }
}
    
class Block 
{
      constructor(timestamp, transactions, previousHash = '') 
      {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();
      }
    
 
      calculateHash() 
      {
        return SHA256(this.previousHash+this.timestamp+JSON.stringify(this.transactions)+this.nonce).toString();
      }
    
      mineBlock(difficulty) 
      {
        while (this.hash.substring(0, difficulty) != Array(difficulty + 1).join('0')) {
          this.nonce++;
          this.hash = this.calculateHash();
        }
    
        console.log('block mined:' ,this.hash);
      }
    
      hasValidTransactions() {
        for (const tx of this.transactions) 
        {
          if (!tx.isValid()) 
            return false;
        }
        return true;
      }
    }
    
    class Blockchain 
    {
      constructor() 
      {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 50;
      }
    
      createGenesisBlock() 
      {
        return new Block(Date.parse('11-05-2019'), [], '0');
      }
    
      getLatestBlock() 
      {
        return this.chain[this.chain.length - 1];
      }
    
      minePendingTransactions(miningRewardAddress) 
      {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log('block mined successfuly!');
        this.chain.push(block);
        this.pendingTransactions = [];
      }
    
      addTransaction(transaction) 
      {
        if (!transaction.fromAddress || !transaction.toAddress) 
        {
          throw new Error('no address');
        }
        if (!transaction.isValid()) 
        {
          throw new Error('invalid transac.');
        }
        if (transaction.amount <= 0) 
        {
          throw new Error('amount < 0');
        }
    
        this.pendingTransactions.push(transaction);
      }
    
      getBalanceOfAddress(address) 
      {
        let balance = 0;
         for (const block of this.chain) {
         for (const trans of block.transactions) {
         if (trans.fromAddress == address) 
            balance -= trans.amount;
         if (trans.toAddress == address) 
              balance += trans.amount;
            }
        }
    
        return balance;
      }
    
      getAllTransactionsForWallet(address) 
      {
        const txs = [];
        for (const block of this.chain) 
        {
          for (const tx of block.transactions) 
          {
            if (tx.fromAddress == address || tx.toAddress == address)
              txs.push(tx);
           }
        }
         return txs;
      }
 
      isChainValid() 
      {
        const realGenesis = JSON.stringify(this.createGenesisBlock());
        if (realGenesis !== JSON.stringify(this.chain[0]))
          return false;
        for (let i = 1; i < this.chain.length; i++) 
        {
          const currentBlock = this.chain[i];
    
          if (!currentBlock.hasValidTransactions())
            return false;
          if (currentBlock.hash != currentBlock.calculateHash()) 
            return false;
         }
        return true;
      }
}


const myWalletAddress = myKey.getPublic('hex');
const coin = new Blockchain();
const trans = new Transaction(myWalletAddress, 'address', 69);
trans.signTransaction(myKey);
coin.addTransaction(trans);
console.log('mining in progress ...\n');
coin.minePendingTransactions(myWalletAddress);
console.log('balance is : ',coin.getBalanceOfAddress(myWalletAddress),'rs\n');
console.log('chain valid ?',coin.isChainValid());

/*const trans2 = new Transaction(myWalletAddress, 'address', 0);
trans2.signTransaction(myKey);
coin.addTransaction(trans);
coin.minePendingTransactions(myWalletAddress);
console.log('balance is : ',coin.getBalanceOfAddress(myWalletAddress),'rs');*/

