require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Web3 } = require('web3');
const { HttpProvider } = require('web3-providers-http');
const cors = require('cors');
const BN = require('bn.js');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

app.use(cors());

let storedPrices = {}; 

const privateKey = process.env.PRIVATE_KEY;
const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

const provider = new HttpProvider(`https://eth-sepolia.g.alchemy.com/v2/6Tr-W5cdRoa43rxahBEl2jwb6_d9fxqR`);
const web3 = new Web3(provider);

const oracleContractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "asset",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "updatePrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "asset",
        "type": "string"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "asset",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "PriceUpdated",
    "type": "event"
  }
];

const oracleContractAddress = process.env.ORACLE_CONTRACT_ADDRESS;
const oracleContract = new web3.eth.Contract(oracleContractABI, oracleContractAddress);

try {
  const account = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
} catch (error) {
  console.error('Error adding account:', error);
  throw error;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const updatePrices = async () => {
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(2); 

  try {
    const response = await axios.get('https://www.cbr.ru/scripts/XML_daily.asp');
    const prices = await parsePrices(response.data);

    const updateStatus = {}; 

    const updateTasks = Object.entries(prices).map(([asset, price]) => 
      limit(async () => {
        let retries = 5;
        let backoff = 1000;
        while (retries > 0) {
          try {
            const priceInWei = web3.utils.toWei(price.toString(), 'ether');
            const data = oracleContract.methods.updatePrice(asset, priceInWei).encodeABI();

            let gasPrice = await web3.eth.getGasPrice();
            gasPrice = new BN(gasPrice).add(new BN(web3.utils.toWei('10', 'gwei'))).toString();


            const nonce = await web3.eth.getTransactionCount(web3.eth.defaultAccount, 'pending');

            const tx = {
              from: web3.eth.defaultAccount,
              to: oracleContractAddress,
              data,
              gas: 1000000,  
              gasPrice: gasPrice,
              nonce: nonce,
            };

            const signed = await web3.eth.accounts.signTransaction(tx, formattedPrivateKey);
            await web3.eth.sendSignedTransaction(signed.rawTransaction);
            console.log(`Price for ${asset} updated to ${price}`);
            updateStatus[asset] = true;
            break; 
          } catch (error) {
            console.error(`Error updating price for ${asset}:`, error);
            if ((error.code === 429 || error.code === -32000) && retries > 0) {
              console.log('Rate limit exceeded or underpriced transaction, retrying with backoff...');
              await delay(backoff); 
              backoff *= 2;
              retries--;
            } else {
              updateStatus[asset] = false; 
              break; 
            }
          }
        }
      })
    );

    await Promise.all(updateTasks); 

    for (const asset in updateStatus) {
      if (updateStatus[asset]) {
        console.log(`Price for ${asset} successfully updated.`);
      } else {
        console.log(`Failed to update price for ${asset}.`);
      }
    }

    storedPrices = prices; 
    return prices;

  } catch (error) {
    console.error('Error updating prices:', error);
    return {};
  }
};

const parsePrices = async (xml) => {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);
  const prices = {};

  const items = result.ValCurs.Valute;
  for (const item of items) {
    const charCode = item.CharCode[0];
    const value = parseFloat(item.Value[0].replace(',', '.'));
    prices[charCode] = value;
  }
  return prices;
};

setInterval(updatePrices, 3600000);

app.get('/update-prices', async (req, res) => {
  try {
    const updatedPrices = await updatePrices();
    res.json(updatedPrices);
  } catch (error) {
    res.status(500).send('Error updating prices');
  }
});

app.get('/get-prices', (req, res) => {
  res.json(storedPrices);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
