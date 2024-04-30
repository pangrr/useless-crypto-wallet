
import { useState, useEffect } from 'react'
import {
  JsonRpcProvider,
  Wallet,
  formatEther,
  parseEther,
} from 'ethers'
import CryptoJS from 'crypto-js'
import { Card, Box, Button, TextField, Container, Typography, Stack, Link, LinearProgress, Paper } from '@mui/material'
import './App.css'

function App() {
  const [privateKey, setPrivateKey] = useState('')
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [etherscanLink, setEtherscanLink] = useState('')
  const [loading, setLoading] = useState(false)

  const provider = new JsonRpcProvider('https://sepolia.infura.io/v3/6797f1a489444e41b8a1f0a5f68d2946')

  useEffect(() => {
    const key = getPrivateKey()
    if (key) {
      loadWallet(key)
    }
  }, []);

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {wallet ?
        <Paper>
          <LinearProgress sx={{ opacity: loading ? 1 : 0 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2, pr: 2, pt: 2 }}>
            <Typography gutterBottom variant="h5" component="div">
              Balance
            </Typography>
            <Typography gutterBottom variant="h6" component="div">
              {balance} ETH
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2, pr: 2, pb: 7 }}>
            <Typography gutterBottom sx={{ fontSize: 14 }} color="text.secondary">
              Wallet Address
            </Typography>
            <Typography gutterBottom sx={{ fontSize: 14 }} color="text.secondary">
              {wallet.address}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ p: 2 }}>
            <TextField
              disabled={loading}
              label="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <TextField
              disabled={loading}
              label="Transfer Amount ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Stack>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Button onClick={transfer} disabled={loading}>Transfer</Button>
              {etherscanLink && <Link href={etherscanLink} target="_blank" variant="inherit" color="inherit">view transaction status</Link>}
              <Button color="success" onClick={logout}>Logout</Button>
            </Stack>
          </Box>
        </Paper>
        :
        <Paper>
          <Box sx={{ p: 2 }}>
            <TextField
              label="Private Key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Button disabled={!privateKey} onClick={() => loadWallet(privateKey)}>
              Load Wallet
            </Button>
            <Button onClick={loadSampleWallet} color='success'>
              Load Wallet with Sample Private Key
            </Button>
          </Stack>
        </Paper>
      }
    </Container>
  )

  function loadSampleWallet() {
    loadWallet('0x27391db49e88c3a1f1a2ccf67e18c088578f86c69a4e393bbbed42685adbe4b2');
  }


  async function loadWallet(key) {
    const wallet = new Wallet(key, provider)
    setWallet(wallet)

    setLoading(true)

    const balance = await wallet.provider.getBalance(wallet.address)

    setBalance(formatEther(balance))
    setLoading(false)

    savePrivateKey(key)
  }

  async function transfer() {
    try {
      setLoading(true);

      const transaction = await wallet.sendTransaction({
        to: recipientAddress,
        value: parseEther(amount),
      })

      setLoading(false);

      setEtherscanLink(`https://sepolia.etherscan.io/tx/${transaction.hash}`)
    } catch (error) {
      console.error('Transaction error:', error)
    }
  }

  function logout() {
    deletePrivateKey()
    setWallet(null)
  }

  function savePrivateKey(key) {
    localStorage.setItem('privateKey', key)
  }

  function getPrivateKey() {
    return localStorage.getItem('privateKey')
  }

  function deletePrivateKey() {
    localStorage.clear();
  }
}

export default App
