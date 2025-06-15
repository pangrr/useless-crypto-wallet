
import { useState, useEffect } from 'react'
import {
  Wallet,
  formatEther,
  parseEther,
  EtherscanProvider
} from 'ethers'
import CryptoJS from 'crypto-js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
import { Fab, AppBar, Toolbar, IconButton, Alert, Snackbar, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, Box, Button, TextField, Container, Typography, Stack, Link, LinearProgress, Paper, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import GitHubIcon from '@mui/icons-material/GitHub'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'

const etherscanApiKey = 'EJBAAEHYPM8Z1ETUW2J7V2AC4PZZZHX718'

function App() {
  const [privateKey, setPrivateKey] = useState('')
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [transactionInitialized, setTransactionInitialized] = useState(null);

  useEffect(() => {
    const key = getPrivateKey()
    if (key) {
      loadWallet(key)
    }
  }, []);

  return (
    <>
      <AppBar color='darkerBackground' enableColorOnDark>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => window.open('https://github.com/pangrr/useless-crypto-wallet', '_blank')} startIcon={<GitHubIcon />} color='inherit'>source code</Button>
          <Alert severity="info">Sepolia Testnet is used by this wallet</Alert>
          <Button sx={{ opacity: wallet ? 1 : 0 }} disabled={!wallet} color='inherit' onClick={exitWallet} startIcon={<ExitToAppIcon />} >exit wallet</Button>
        </Toolbar>
      </AppBar>
      <Toolbar variant="dense" />
      <Container maxWidth="md" sx={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {wallet ?
          <Paper sx={{ maxHeight: '100%' }}>
            
            <LinearProgress sx={{ opacity: loading ? 1 : 0 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2, pr: 2, pt: 2 }}>
              <Typography gutterBottom variant="h5" component="div">Balance</Typography>
              <Typography gutterBottom variant="h6" component="div">{balance} ETH</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pl: 2, pr: 2, pb: 7 }}>
              <Typography gutterBottom sx={{ fontSize: 14 }} color="text.secondary">Wallet Address</Typography>
              <Typography gutterBottom sx={{ fontSize: 14 }} color="text.secondary">{wallet.address}</Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ p: 2 }}>
              <TextField disabled={loading} label="Recipient Address" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
              <TextField disabled={loading} label="Transfer Amount ETH" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Stack>
            <Button variant="outlined" onClick={send} disabled={loading} sx={{ margin: 2 }}>Transfer</Button>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>Recent Transactions</AccordionSummary>
              <AccordionDetails>
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{ height: 1 }}>
                        <TableCell>Amount (ETH)</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell></TableCell>
                        <TableCell>Counter Party Address</TableCell>
                        <TableCell><IconButton onClick={() => getRecentTransactions(wallet.address)} size='small'><RefreshIcon fontSize='inherit' /></IconButton></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTransactions.map((t) => {
                        const isSend = t.from.toLowerCase() === wallet.address.toLowerCase()
                        return <TableRow onClick={() => showTransactionDetail(t)} hover key={t.hash} sx={{ cursor: 'pointer' }}>
                          <TableCell sx={{ color: `${isSend ? 'orange' : 'limegreen'}` }}>{`${isSend ? '-' : '+'}${formatEther(t.value)}`}</TableCell>
                          <TableCell sx={{ color: 'lightgrey' }}>{dayjs.unix(t.timeStamp).fromNow()}</TableCell>
                          <TableCell sx={{ color: 'grey' }}>{isSend ? 'to' : 'from'}</TableCell>
                          <TableCell sx={{ color: 'lightgrey' }}>{isSend ? t.to : t.from}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Paper>
          :
          <Paper>
            <Box sx={{ p: 2 }}>
              <TextField label="Private Key" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
            </Box>
            <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button disabled={!privateKey} onClick={() => loadWallet(privateKey)}>Load Wallet</Button>
              <Button onClick={loadSampleWallet}>Use Sample Private Key</Button>
            </Stack>
          </Paper>
        }
      </Container>
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={!!transactionInitialized} autoHideDuration={30000}>
        <Alert severity="success" sx={{ width: '100%' }}
          action={<Button color="inherit" size="small" onClick={() => {
            showTransactionDetail(transactionInitialized)
            setTransactionInitialized(null)
          }}>View detail</Button>}
        >Transaction Initialized</Alert>
      </Snackbar>
    </>
  )

  function loadSampleWallet() {
    loadWallet('0x27391db49e88c3a1f1a2ccf67e18c088578f86c69a4e393bbbed42685adbe4b2');
  }

  async function getRecentTransactions(address) {
    const resp = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=999999999999&sort=desc&apikey=${etherscanApiKey}`)
    return (await resp.json()).result
  }

  function showTransactionDetail(transaction) {
    window.open(`https://sepolia.etherscan.io/tx/${transaction.hash}`, '_blank')
  }

  async function loadWallet(key) {
    const provider = new EtherscanProvider('sepolia', etherscanApiKey)
    const wallet = new Wallet(key, provider)
    setWallet(wallet)
    setLoading(true)

    setRecentTransactions(await getRecentTransactions(wallet.address))
    setBalance(formatEther(await wallet.provider.getBalance(wallet.address)))

    setLoading(false)
    savePrivateKey(key)
  }

  async function send() {
    setLoading(true);
    try {
      const transaction = await wallet.sendTransaction({
        to: recipientAddress,
        value: parseEther(amount),
      })
      setTransactionInitialized(transaction)
    } catch (e) {
      console.error('transfer', e)
    }
    setLoading(false);
  }

  function exitWallet() {
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
