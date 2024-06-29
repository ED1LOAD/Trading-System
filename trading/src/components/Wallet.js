import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Box, Typography, TextField, Button, Grid, Paper, AppBar, Toolbar } from '@mui/material';

const Wallet = ({ walletAddress }) => {
  const [account, setAccount] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USD');
  const [cbrData, setCbrData] = useState(null);
  const [prices, setPrices] = useState({});
  const navigate = useNavigate();

  const walletContractAddress = '0x6b329c1eb8e767ab64c35daad67e15fd8101dbba'; // Wallet contract address
  const oracleContractAddress = '0x854ae55cb567d42bbb4673170ccdc8b97595694f'; // PriceOracle contract address

  const walletContractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "getBalance",
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_asset",
          "type": "string"
        }
      ],
      "name": "buy",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_asset",
          "type": "string"
        }
      ],
      "name": "sell",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

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

  useEffect(() => {
    const savedWalletData = JSON.parse(localStorage.getItem('walletData'));
    if (savedWalletData && savedWalletData.address === walletAddress) {
      setStatus('Загружен сохраненный кошелек.');
      setPrivateKey(savedWalletData.privateKey); // Load the private key
    }
  }, [walletAddress]);

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      try {
        await provider.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        console.log('Accounts:', accounts);
        setAccount(accounts[0]);
        setStatus('Кошелек подключен.');
      } catch (error) {
        setStatus('Не удалось подключиться к MetaMask. Убедитесь, что он установлен и настроен.');
        console.error('MetaMask connection error:', error);
      }
    } else {
      setStatus('Пожалуйста, установите MetaMask!');
    }
  };

  const checkBalance = async () => {
    if (!account) {
      setStatus('Сначала подключите кошелек.');
      return;
    }
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(walletContractABI, walletAddress);

      try {
        const result = await contract.methods.getBalance().call();
        const formattedBalance = parseFloat(web3.utils.fromWei(result, 'ether')).toFixed(6);
        setBalance(formattedBalance);
        setStatus('Баланс успешно получен.');
      } catch (error) {
        setStatus('Не удалось получить баланс.');
        console.error('Balance check error:', error);
      }
    }
  };

  const depositFunds = async () => {
    if (!account) {
      setStatus('Сначала подключите кошелек.');
      return;
    }
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
  
      try {
        const weiAmount = web3.utils.toWei(amount, 'ether');
        console.log('Sending transaction from:', account, 'to:', walletAddress, 'amount:', weiAmount);
  
        await web3.eth.sendTransaction({
          from: account,
          to: walletAddress,
          value: weiAmount,
          gas: 100000 // Установите лимит газа
        });
  
        setStatus('Средства успешно внесены!');
        checkBalance();
      } catch (error) {
        setStatus('Не удалось внести средства.');
        console.error('Deposit error:', error);
        console.error('Error details:', error.message);
      }
    }
  };

  const withdrawFunds = async () => {
    if (!account) {
      setStatus('Сначала подключите кошелек.');
      return;
    }
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(walletContractABI, walletAddress);

      try {
        await contract.methods.withdraw(web3.utils.toWei(amount, 'ether')).send({ from: account });
        setStatus('Средства успешно выведены!');
        checkBalance();
      } catch (error) {
        setStatus('Не удалось вывести средства.');
        console.error('Withdraw error:', error);
      }
    }
  };

  const buyAsset = async () => {
    if (!account) {
      setStatus('Сначала подключите кошелек.');
      return;
    }
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(walletContractABI, walletAddress);

      try {
        const amountInEth = web3.utils.toWei(amount, 'ether');
        const amountInAsset = await calculateAmountInAsset(amountInEth, asset);
        if (amountInAsset) {
          await contract.methods.buy(amountInEth, asset).send({ from: account });
          setStatus(`Успешная покупка ${amountInAsset} ${asset}`);
          checkBalance();
        }
      } catch (error) {
        setStatus('Не удалось купить актив.');
        console.error('Buy error:', error);
      }
    }
  };

  const sellAsset = async () => {
    if (!account) {
      setStatus('Сначала подключите кошелек.');
      return;
    }
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(walletContractABI, walletAddress);

      try {
        const amountInEth = await calculateAmountInEth(amount, asset);
        if (amountInEth) {
          await contract.methods.sell(amountInEth, asset).send({ from: account });
          setStatus(`Успешная продажа ${amount} ${asset}`);
          checkBalance();
        }
      } catch (error) {
        setStatus('Не удалось продать актив.');
        console.error('Sell error:', error);
      }
    }
  };

  const getPrice = async (asset) => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const oracleContract = new web3.eth.Contract(oracleContractABI, oracleContractAddress);

      try {
        const price = await oracleContract.methods.getPrice(asset).call();
        setStatus(`Актуальная цена ${asset}: ${web3.utils.fromWei(price, 'ether')} ETH`);
      } catch (error) {
        setStatus('Не удалось получить цену.');
        console.error('Price fetch error:', error);
      }
    }
  };

  const calculateAmountInAsset = async (amountInEth, asset) => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const oracleContract = new web3.eth.Contract(oracleContractABI, oracleContractAddress);

      try {
        const priceInEth = await oracleContract.methods.getPrice(asset).call();
        const amountInAsset = web3.utils.fromWei(amountInEth, 'ether') / web3.utils.fromWei(priceInEth, 'ether');
        return amountInAsset;
      } catch (error) {
        setStatus('Не удалось получить цену актива.');
        console.error('Price fetch error:', error);
        return null;
      }
    }
  };

  const calculateAmountInEth = async (amountInAsset, asset) => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      const oracleContract = new web3.eth.Contract(oracleContractABI, oracleContractAddress);

      try {
        const priceInEth = await oracleContract.methods.getPrice(asset).call();
        const amountInEth = web3.utils.toWei((amountInAsset * web3.utils.fromWei(priceInEth, 'ether')).toString(), 'ether');
        return amountInEth;
      } catch (error) {
        setStatus('Не удалось получить цену актива.');
        console.error('Price fetch error:', error);
        return null;
      }
    }
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleAssetChange = (event) => {
    setAsset(event.target.value);
  };

  const fetchCbrData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/update-prices');
      setCbrData(response.data);
      setStatus('Данные с Центробанка успешно получены.');
      fetchPrices();
    } catch (error) {
      setStatus('Не удалось получить данные с Центробанка.');
      console.error('CBR data fetch error:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await axios.get('http://localhost:3000/get-prices');
      setPrices(response.data);
      setStatus('Цены успешно обновлены.');
    } catch (error) {
      setStatus('Не удалось обновить цены.');
      console.error('Prices fetch error:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Кошелек</Typography>
        </Toolbar>
      </AppBar>
      <Box my={4}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={connectWallet}>Подключить кошелек</Button>
            </Grid>
            {account && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Аккаунт: {account}</Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Статус: {status}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="secondary" onClick={checkBalance}>Проверить баланс</Button>
            </Grid>
            {balance && (
              <Grid item xs={12}>
                <Typography variant="h6">Баланс: {balance} ETH</Typography>
              </Grid>
            )}
            {walletAddress && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Адрес кошелька: {walletAddress}</Typography>
              </Grid>
            )}
            {privateKey && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Приватный ключ: {privateKey}</Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Сумма в ETH"
                variant="outlined"
                fullWidth
                value={amount}
                onChange={handleAmountChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Актив (напр., USD)"
                variant="outlined"
                fullWidth
                value={asset}
                onChange={handleAssetChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={depositFunds}>Внести средства</Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={withdrawFunds}>Вывести средства</Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={buyAsset}>Купить актив</Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={sellAsset}>Продать актив</Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={() => getPrice(asset)}>Получить цену</Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={fetchCbrData}>Получить данные с Центробанка</Button>
            </Grid>
            {cbrData && (
              <Grid item xs={12}>
                <pre>{JSON.stringify(cbrData, null, 2)}</pre>
              </Grid>
            )}
            {prices && (
              <Grid item xs={12}>
                <Typography variant="h6">Актуальные цены</Typography>
                {Object.entries(prices).map(([key, value]) => (
                  <Typography key={key}>{key}: {value}</Typography>
                ))}
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Wallet;
