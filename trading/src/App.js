// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Wallet from './components/Wallet';
import { useParams } from 'react-router-dom';
import { CssBaseline, Container, Typography } from '@mui/material';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Container maxWidth="md">
        <header className="App-header">
          <Typography variant="h3" component="h1" gutterBottom>
            Trading System
          </Typography>
          <Routes>
            <Route path="/wallet/:address" element={<WalletPage />} />
            <Route path="/" element={<Register />} />
          </Routes>
        </header>
      </Container>
    </Router>
  );
}

const WalletPage = () => {
  const { address } = useParams();
  return <Wallet walletAddress={address} />;
};

export default App;
