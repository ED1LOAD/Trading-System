// src/components/Register.js
import React, { useState } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Grid } from '@mui/material';

const Register = () => {
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [newPrivateKey, setNewPrivateKey] = useState('');
  const [showCreateWallet, setShowCreateWallet] = useState(true);
  const navigate = useNavigate();

  const factoryABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "walletAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "WalletCreated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "createWallet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]; // ABI фабричного контракта
  const factoryAddress = '0x1968fa548e29c01ef2973d35156f9c41d039b550'; // Адрес задеплоенного фабричного контракта

  const createWallet = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      await provider.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);

      try {
        const receipt = await factoryContract.methods.createWallet().send({ from: accounts[0] });

        const event = receipt.events.WalletCreated;
        const newWalletAddress = event.returnValues.walletAddress;
        const newAccount = web3.eth.accounts.create();

        setWalletAddress(newWalletAddress);
        setNewPrivateKey(newAccount.privateKey);

        localStorage.setItem('walletData', JSON.stringify({
          address: newWalletAddress,
          privateKey: newAccount.privateKey
        }));

        setStatus('Кошелек успешно создан!');
        navigate(`/wallet/${newWalletAddress}`);
      } catch (error) {
        setStatus('Не удалось создать кошелек.');
        console.error(error);
      }
    } else {
      setStatus('Пожалуйста, установите MetaMask!');
    }
  };

  const handleLogin = () => {
    const savedWalletData = JSON.parse(localStorage.getItem('walletData'));
    if (savedWalletData) {
      setWalletAddress(savedWalletData.address);
      navigate(`/wallet/${savedWalletData.address}`);
    } else {
      setStatus('Нет сохраненного кошелька. Пожалуйста, создайте новый кошелек.');
    }
  };

  const toggleForm = () => {
    setShowCreateWallet(!showCreateWallet);
    setStatus('');
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Регистрация
          </Typography>
          {showCreateWallet ? (
            <div>
              <Button variant="contained" color="primary" onClick={createWallet} fullWidth>
                Создать кошелек
              </Button>
              {account && <Typography variant="subtitle1">Аккаунт: {account}</Typography>}
              <Typography variant="body1">Статус: {status}</Typography>
              {newPrivateKey && (
                <Box mt={2}>
                  <Typography variant="subtitle1">Новый приватный ключ: {newPrivateKey}</Typography>
                  <Typography variant="body2">Скопируйте этот приватный ключ и импортируйте его в MetaMask.</Typography>
                </Box>
              )}
            </div>
          ) : (
            <div>
              <Button variant="contained" color="primary" onClick={handleLogin} fullWidth>
                Войти в уже созданный кошелек
              </Button>
              <Typography variant="body1">Статус: {status}</Typography>
            </div>
          )}
          <Button variant="outlined" color="secondary" onClick={toggleForm} fullWidth style={{ marginTop: '20px' }}>
            {showCreateWallet ? 'Войти в уже созданный кошелек' : 'Создать новый кошелек'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
