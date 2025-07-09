import React, { useState, useEffect, useRef } from 'react';
import { BrowserProvider, Contract, formatEther, formatUnits, parseUnits, parseEther } from 'ethers';
import { MetaMaskSDK } from '@metamask/sdk';
import { MetaMaskInpageProvider } from '@metamask/providers'; // For type hinting
import YieldFlowABI from '../abis/YieldFlow.json'; // 
import USDCABI from '../abis/USDC.json'; // Use a standard ERC20 ABI or copy from OpenZeppelin
import ReputationNFTABI from '../abis/ReputationNFT.json';
import {
  UserCircleIcon,
  WalletIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ArrowPathIcon,
  SunIcon,
  MoonIcon,
  HomeIcon,
  CreditCardIcon,
  GiftIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'; // Using Heroicons for a clean look
import { HomeIcon as HomeIconSolid, CreditCardIcon as CreditCardIconSolid, GiftIcon as GiftIconSolid, ClockIcon as ClockIconSolid, Cog6ToothIcon as Cog6ToothIconSolid } from '@heroicons/react/24/solid';
import { OneInchCustomSwap } from "./OneInchSwap";

// Define the contract address (replace with your deployed contract address later)
const YIELD_FLOW_CONTRACT_ADDRESS = process.env.REACT_APP_YIELDFLOW_CONTRACT || '0xdF9c96bb0BFd9Bc3808B2C1E2a2f10E89D9ed962';
const USDC_CONTRACT_ADDRESS = process.env.REACT_APP_USDC_ADDRESS || '0x65aFADD39029741B3b8f0756952C74678c9cEC93';
const REPUTATION_NFT_CONTRACT_ADDRESS = process.env.REACT_APP_REPUTATIONNFT_CONTRACT || '0xAaBE83F65763E51Ff385153A959D4A1490706bf2';

const LOGO_URL = 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg';

// Type definitions for better type safety
interface Window {
  ethereum?: MetaMaskInpageProvider;
}

function isMobile() {
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

// Initialize MetaMask SDK
// This configuration will open the MetaMask mobile app if on mobile
// and connect to the browser extension on desktop.
const MMSDK = isMobile()
  ? new MetaMaskSDK({
  dappMetadata: {
    name: 'MetaCard YieldFlow',
    url: window.location.href,
  },
    })
  : null;

// Helper to shorten wallet address
function shortenAddress(addr: string) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
}

// Card tier logic
function getCardTier(score: number) {
  return { tier: score >= 100 ? 'Platinum' : score >= 50 ? 'Gold' : score >= 10 ? 'Silver' : 'Classic', color: 'bg-[#181818]', text: 'text-white' };
}

// Add confetti animation (simple CSS burst)
const Confetti: React.FC<{ show: boolean }> = ({ show }) => show ? (
  <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
    <div className="relative w-64 h-64">
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute w-3 h-3 rounded-full" style={{
          background: `hsl(${i * 12}, 90%, 60%)`,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) rotate(${i * 12}deg) translateY(-80px)`,
          animation: 'confetti-burst 1s cubic-bezier(0.4,0,0.2,1) both',
          animationDelay: `${i * 0.02}s`,
        }} />
      ))}
    </div>
  </div>
) : null;

// VirtualCard component (redesigned, with shine and bounce)
const VirtualCard: React.FC<{ account: string, usdcBalance: string, reputationScore: string, animateBounce: boolean }> = ({ account, usdcBalance, reputationScore, animateBounce }) => {
  const score = Number(reputationScore);
  const { tier } = getCardTier(score);
  return (
    <div className="relative w-full max-w-lg mx-auto animate-fade-in" style={{ aspectRatio: '16/9', minHeight: 240, background: 'linear-gradient(120deg, #ff7c2b 0%, #ffb347 100%)', borderRadius: '2rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }}>
      {/* Card content */}
      <div className="relative z-20 flex flex-col h-full justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="font-bold text-3xl tracking-tight" style={{ color: '#013330', fontFamily: 'Montserrat, Impact, Arial Black, sans-serif', letterSpacing: '-2px' }}>MetaCard</span>
          <span className="font-medium text-xs px-3 py-1 rounded-full text-orange-900 bg-white bg-opacity-80 uppercase tracking-wider">{getCardTier(Number(reputationScore)).tier}</span>
        </div>
        <div className="mt-2">
          <div className="text-lg font-mono tracking-widest" style={{ color: '#013330' }}>{shortenAddress(account)}</div>
          <div className="text-xs mt-1" style={{ color: '#013330' }}>Card Balance</div>
          <div className="text-2xl font-bold" style={{ color: '#013330' }}>{usdcBalance} USDC</div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs" style={{ color: '#013330' }}>Exp: 12/29</div>
          <div className="text-xs" style={{ color: '#013330' }}>CVV: ***</div>
          <div className="flex items-center">
            <span className="text-xs mr-2" style={{ color: '#013330' }}>Virtual</span>
            {/* Mastercard logo style */}
            <span className="inline-block w-7 h-7 rounded-full bg-red-500 border-2 border-white mr-[-8px]" />
            <span className="inline-block w-7 h-7 rounded-full bg-yellow-400 border-2 border-white" />
          </div>
        </div>
      </div>
      <div className="mt-8 text-xs text-gray-600 text-center space-y-1">
        <div>• Linked to your wallet</div>
        <div>• Earn on-chain reputation</div>
        <div>• Unlock NFT badge rewards</div>
      </div>
    </div>
  );
};

// Toolbar/Dashboard with click actions
const Toolbar: React.FC<{ darkMode: boolean, onNav: (section: string) => void }> = ({ darkMode, onNav }) => (
  <div className={`glass-nav flex justify-center items-center space-x-8 py-3 ${darkMode ? 'bg-gray-900 bg-opacity-80' : 'bg-white bg-opacity-90'} rounded-2xl mb-6 shadow-lg`}>
    <button title="Home" onClick={() => onNav('home')}><HomeIcon className="h-7 w-7 text-orange-500 hover:text-orange-700" /></button>
    <button title="Card" onClick={() => onNav('card')}><CreditCardIcon className="h-7 w-7 text-orange-500 hover:text-orange-700" /></button>
    <button title="Rewards" onClick={() => onNav('rewards')}><GiftIcon className="h-7 w-7 text-orange-500 hover:text-orange-700" /></button>
    <button title="History" onClick={() => onNav('history')}><ClockIcon className="h-7 w-7 text-orange-500 hover:text-orange-700" /></button>
    <button title="Settings" onClick={() => onNav('settings')}><Cog6ToothIcon className="h-7 w-7 text-orange-500 hover:text-orange-700" /></button>
  </div>
);

const featuresSectionId = 'features-section';
const aboutSectionId = 'about-section';

const MetaMaskConnect: React.FC = () => {
  // Inject global styles for animation, illusion, and airbrush minimalism
  useEffect(() => {
    // Restore pastel/gradient background and glassy look
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        background: linear-gradient(120deg, #ffe5c3 0%, #e5ffc3 100%);
        min-height: 100vh;
        overflow-x: hidden;
        font-family: 'Montserrat', 'Inter', Arial, sans-serif;
      }
      .glass-card, .glass-nav, .glass-footer {
        background: rgba(255,255,255,0.85);
        box-shadow: 0 8px 32px 0 rgba(60,60,100,0.10), 0 2px 8px 0 rgba(0,0,0,0.08);
        border-radius: 2rem;
        backdrop-filter: blur(16px) saturate(1.2);
        border: 1.5px solid rgba(255,255,255,0.18);
      }
      .pastel-btn {
        background: linear-gradient(90deg, #ffe5c3 0%, #c3eaff 100%);
        color: #013330;
        border-radius: 9999px;
        font-weight: 700;
        box-shadow: 0 2px 8px 0 rgba(0,0,0,0.07);
        transition: background 0.2s, transform 0.2s;
      }
      .pastel-btn:hover {
        background: linear-gradient(90deg, #f7c3ff 0%, #e3f7e8 100%);
        transform: scale(1.04);
      }
      .minimal-input {
        background: rgba(255,255,255,0.7);
        border-radius: 1rem;
        border: 1.5px solid #e0e7fa;
        box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
        font-size: 1rem;
        color: #013330;
        padding: 0.75rem 1.25rem;
        transition: border 0.2s;
      }
      .minimal-input:focus {
        border: 1.5px solid #c3eaff;
        outline: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // State variables (declare each only once)
  const [ethereum, setEthereum] = useState<MetaMaskInpageProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [deposited, setDeposited] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [reputationScore, setReputationScore] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [nftOwned, setNftOwned] = useState<boolean>(false);
  const [nftMeta, setNftMeta] = useState<any>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [showLifiModal, setShowLifiModal] = useState(false);
  const [circleAmount, setCircleAmount] = useState('');
  const [circleCardId, setCircleCardId] = useState('');
  const [circleLoading, setCircleLoading] = useState(false);
  const [circleError, setCircleError] = useState<string | null>(null);
  const [widgetError, setWidgetError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [animateBounce, setAnimateBounce] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [amount, setAmount] = useState("");

  const accountRef = useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rewardsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const lastTxRef = useRef<HTMLLIElement>(null);

  // Track previous tier for confetti
  const prevTier = useRef(getCardTier(Number(reputationScore)).tier);
  useEffect(() => {
    const currentTier = getCardTier(Number(reputationScore)).tier;
    if (prevTier.current !== currentTier) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
      prevTier.current = currentTier;
    }
  }, [reputationScore]);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  useEffect(() => {
    let currentEthereum: MetaMaskInpageProvider | null = null;

    const initMetaMask = async () => {
      try {
        let provider: MetaMaskInpageProvider | null = null;
        if (isMobile() && MMSDK) {
          provider = MMSDK.getProvider() as MetaMaskInpageProvider;
        } else if ((window as any).ethereum) {
          provider = (window as any).ethereum as MetaMaskInpageProvider;
        }
        if (provider) {
          setEthereum(provider);
          currentEthereum = provider;

          provider.on('accountsChanged', (...args: unknown[]) => {
            const accounts = args[0] as string[];
            if (accounts && accounts.length > 0) {
              setAccount(accounts[0] ?? null);
              fetchBalancesAndScore(accounts[0] ?? '', provider);
            } else {
              setAccount(null);
              setUsdcBalance('0');
              setEthBalance('0');
              setReputationScore('0');
            }
          });

          provider.on('chainChanged', (...args: unknown[]) => {
            const chainId = args[0] as string;
            console.log('Chain changed to:', chainId);
            if (accountRef.current) {
              fetchBalancesAndScore(accountRef.current, provider!);
            }
          });

          const accounts = await provider.request<string[]>({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0] ?? null);
            fetchBalancesAndScore(accounts[0] ?? '', provider);
          }
        } else {
          setError('MetaMask provider not found. Please install MetaMask.');
        }
      } catch (err: any) {
        console.error('Error initializing MetaMask SDK:', err);
        setError(`Error connecting to MetaMask: ${err.message}`);
      }
    };

    initMetaMask();

    return () => {
      if (currentEthereum) {
        currentEthereum.removeAllListeners('accountsChanged');
        currentEthereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Function to connect to MetaMask
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!ethereum) {
        setError('MetaMask provider not found. Please install MetaMask.');
        setLoading(false);
        return;
      }

      const accounts = await ethereum.request<string[]>({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0] ?? null);
        await fetchBalancesAndScore(accounts[0] ?? '', ethereum);
      }
    } catch (err: any) {
      console.error('Error connecting to MetaMask:', err);
      setError(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch balances and reputation score
  const fetchBalancesAndScore = async (address: string, provider: MetaMaskInpageProvider) => {
    setLoading(true);
    setError(null);
    try {
      const ethersProvider = new BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();

      // Fetch ETH balance
      const ethWei = await ethersProvider.getBalance(address);
      setEthBalance(formatEther(ethWei));

      // Fetch USDC balance
      const usdcContract = new Contract(USDC_CONTRACT_ADDRESS, USDCABI, signer);
      const usdcBal = await usdcContract.balanceOf(address);
      setUsdcBalance(formatUnits(usdcBal, 6)); // USDC has 6 decimals

      // Fetch Reputation Score from YieldFlow contract
      const yieldFlowContract = new Contract(
        YIELD_FLOW_CONTRACT_ADDRESS,
        YieldFlowABI.abi,
        signer
      );
      try {
        const score = await yieldFlowContract.getReputationScore(address);
        setReputationScore(score.toString());
      } catch (contractErr: any) {
        console.warn('Could not fetch reputation score:', contractErr.message);
        setReputationScore('0 (Mock)');
      }
    } catch (err: any) {
      console.error('Error fetching balances or score:', err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Deposit USDC
  const handleDeposit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!ethereum || !account) throw new Error('Wallet not connected');
      const ethersProvider = new BrowserProvider(ethereum as any);
      const signer = await ethersProvider.getSigner();
      const amount = parseUnits(depositAmount || '0', 6); // USDC has 6 decimals
      if (amount <= BigInt(0)) throw new Error('Enter a valid amount');
      const usdcContract = new Contract(USDC_CONTRACT_ADDRESS, USDCABI, signer);
      // Approve YieldFlow contract to spend USDC
      const approveTx = await usdcContract.approve(YIELD_FLOW_CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      // Deposit USDC
      const yieldFlowContract = new Contract(YIELD_FLOW_CONTRACT_ADDRESS, YieldFlowABI.abi, signer);
      const depositTx = await yieldFlowContract.depositUSDC(amount);
      await depositTx.wait();
      setTxStatus('Deposit successful!');
      fetchBalancesAndScore(account, ethereum);
      setDepositAmount('');
    } catch (err: any) {
      setError(`Deposit failed: ${err.message}`);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Spend USDC
  const handleSpend = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!ethereum || !account) throw new Error('Wallet not connected');
      const ethersProvider = new BrowserProvider(ethereum as any);
      const signer = await ethersProvider.getSigner();
      const spendValue = parseUnits(amount || '0', 6); // USDC has 6 decimals
      if (spendValue <= BigInt(0)) throw new Error('Enter a valid amount');
      const yieldFlowContract = new Contract(YIELD_FLOW_CONTRACT_ADDRESS, YieldFlowABI.abi, signer);
      const spendTx = await yieldFlowContract.spendUSDC(spendValue, 'Test spend');
      await spendTx.wait();
      setTxStatus('Spend successful!');
      fetchBalancesAndScore(account, ethereum);
      setAmount('');
    } catch (err: any) {
      setError(`Spend failed: ${err.message}`);
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch NFT ownership and metadata
  const fetchNftOwnership = async (address: string, provider: MetaMaskInpageProvider) => {
    try {
      const ethersProvider = new BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      const nftContract = new Contract(REPUTATION_NFT_CONTRACT_ADDRESS, ReputationNFTABI.abi, signer);
      const balance = await nftContract.balanceOf(address);
      setNftOwned(balance > 0);
      if (balance > 0) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, 0);
        const tokenURI = await nftContract.tokenURI(tokenId);
        // Fetch metadata from tokenURI
        const resp = await fetch(tokenURI);
        const meta = await resp.json();
        setNftMeta(meta);
      } else {
        setNftMeta(null);
      }
    } catch (err) {
      setNftOwned(false);
      setNftMeta(null);
    }
  };

  // Fetch transaction history (YieldFlow events)
  const fetchTxHistory = async (provider: MetaMaskInpageProvider) => {
    try {
      const ethersProvider = new BrowserProvider(provider as any);
      const yieldFlowContract = new Contract(YIELD_FLOW_CONTRACT_ADDRESS, YieldFlowABI.abi, ethersProvider);
      // Get last 10 events (YieldDeposited, YieldSpent, FundsWithdrawn)
      const depositEvents = await yieldFlowContract.queryFilter(yieldFlowContract.filters.YieldDeposited(), -10000);
      const spendEvents = await yieldFlowContract.queryFilter(yieldFlowContract.filters.YieldSpent(), -10000);
      const withdrawEvents = await yieldFlowContract.queryFilter(yieldFlowContract.filters.FundsWithdrawn(), -10000);
      const allEvents = [...depositEvents, ...spendEvents, ...withdrawEvents].sort((a, b) => b.blockNumber - a.blockNumber);
      setTxHistory(allEvents.slice(0, 10));
    } catch (err) {
      setTxHistory([]);
    }
  };

  // Update useEffect to fetch NFT and tx history
  useEffect(() => {
    if (account && ethereum) {
      fetchNftOwnership(account, ethereum);
      fetchTxHistory(ethereum);
    }
  }, [account, ethereum]);

  // Withdraw USDC
  const handleWithdrawUSDC = async () => {
    setLoading(true);
    setError(null);
    setToast(null);
    try {
      if (!ethereum || !account) throw new Error('Wallet not connected');
      const ethersProvider = new BrowserProvider(ethereum as any);
      const signer = await ethersProvider.getSigner();
      const amount = parseUnits(withdrawAmount || '0', 6); // USDC has 6 decimals
      if (amount <= BigInt(0)) throw new Error('Enter a valid amount');
      const yieldFlowContract = new Contract(YIELD_FLOW_CONTRACT_ADDRESS, YieldFlowABI.abi, signer);
      const withdrawTx = await yieldFlowContract.withdrawUSDC(amount);
      await withdrawTx.wait();
      setToast('Withdraw successful!');
      fetchBalancesAndScore(account, ethereum);
      setWithdrawAmount('');
    } catch (err: any) {
      setToast(`Withdraw failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw ETH
  const handleWithdrawETH = async () => {
    setLoading(true);
    setError(null);
    setToast(null);
    try {
      if (!ethereum || !account) throw new Error('Wallet not connected');
      const ethersProvider = new BrowserProvider(ethereum as any);
      const signer = await ethersProvider.getSigner();
      const amount = parseEther('0.01'); // 0.01 ETH
      const yieldFlowContract = new Contract(YIELD_FLOW_CONTRACT_ADDRESS, YieldFlowABI.abi, signer);
      const withdrawTx = await yieldFlowContract.withdrawETH(amount);
      await withdrawTx.wait();
      setToast('ETH Withdraw successful!');
      fetchBalancesAndScore(account, ethereum);
    } catch (err: any) {
      setToast(`ETH Withdraw failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Dark/light mode toggle
  const toggleDarkMode = () => setDarkMode((d) => !d);

  // Circle API Top-Up Handler
  const handleCircleTopUp = async () => {
    setCircleLoading(true);
    setCircleError(null);
    try {
      const res = await fetch('http://localhost:4000/api/circle/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: circleAmount, currency: 'USD', cardId: circleCardId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setToast('Top-up successful!');
      setShowCircleModal(false);
    } catch (err: any) {
      setCircleError(`Circle Top-up failed: ${err.message}`);
    } finally {
      setCircleLoading(false);
    }
  };

  // Toolbar navigation actions
  const handleNav = (section: string) => {
    if (section === 'home') dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'card') cardRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'rewards') rewardsRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (section === 'history') {
      if (lastTxRef.current) lastTxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else historyRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (section === 'settings') setShowSettings(true);
  };

  // Animate card on spend
  const handleSpendWithAnimation = async () => {
    setAnimateBounce(true);
    await handleSpend();
    setTimeout(() => setAnimateBounce(false), 700);
  };

  // Landing page layout for disconnected wallet
  if (!account) {
    // Handler for Features and About scroll
    const handleFeaturesClick = () => {
      const section = document.getElementById(featuresSectionId);
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    };
    const handleAboutClick = () => {
      const section = document.getElementById(aboutSectionId);
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    };
    return (
      <div style={{ minHeight: '100vh', background: '#e5ffc3', width: '100vw', minWidth: '100vw', position: 'relative' }} className="w-full">
        {/* Sticky Top Nav Bar */}
        <nav className="sticky top-4 z-50 w-[98%] mx-auto flex items-center justify-between px-12 py-6 bg-white shadow-sm rounded-2xl" style={{ color: '#013330' }}>
          {/* Left: Logo */}
          <div className="flex items-center">
            <span className="font-bold text-lg md:text-3xl tracking-tight" style={{ color: '#013330', fontFamily: 'Arial Black, sans-serif', letterSpacing: '-2px' }}>
              MetaCard YieldFlow
            </span>
          </div>
          {/* Center: Nav Links */}
          <div className="flex items-center space-x-8">
            <button onClick={handleFeaturesClick} className="text-base md:text-xl font-bold hover:underline" style={{ color: '#013330' }}>
              Features
            </button>
            <button onClick={handleAboutClick} className="text-base md:text-xl font-bold hover:underline" style={{ color: '#013330' }}>
              Developer
            </button>
          </div>
          {/* Right: Connect Wallet Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={connectWallet}
              className="bg-black text-white font-extrabold text-lg px-8 py-2 rounded-full shadow hover:bg-gray-800 transition duration-200"
              style={{ fontFamily: ' Arial Black, sans-serif' }}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect MetaMask Wallet'}
            </button>
          </div>
        </nav>
        {/* Main Content: Card left, Connect right */}
        <div className="flex flex-row items-center justify-between w-full">
          {/* Left: MetaMask Card Illustration */}
          <div className="flex-1 flex items-center justify-center h-screen">
            <div className="relative w-[420px] h-[260px] rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(120deg, #ff7c2b 0%, #ffb347 100%)', minWidth: 340, transform: 'rotate(8deg)' }}>
              {/* Shine animation */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none animate-shine-card" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.15) 100%)', opacity: 0.7 }} />
              {/* Card content (mock values) */}
              <div className="relative z-20 flex flex-col h-full justify-between p-6">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-3xl tracking-tight" style={{ color: '#013330', fontFamily: ' Arial Black, sans-serif', letterSpacing: '-2px' }}>MetaCard</span>
                  <span className="font-medium text-xs px-3 py-1 rounded-full text-orange-900 bg-white bg-opacity-80 uppercase tracking-wider">Classic</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-mono tracking-widest" style={{ color: '#013330' }}>0x1234...abcd</div>
                  <div className="text-xs mt-1" style={{ color: '#013330' }}>Card Balance</div>
                  <div className="text-2xl font-bold" style={{ color: '#013330' }}>-- USDC</div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs">Exp: --/--</div>
                  <div className="text-xs">CVV: ---</div>
                  <div className="flex items-center">
                    <span className="text-xs mr-2">Virtual</span>
                    {/* Mastercard logo style */}
                    <span className="inline-block w-7 h-7 rounded-full bg-red-500 border-2 border-white mr-[-8px]" />
                    <span className="inline-block w-7 h-7 rounded-full bg-yellow-400 border-2 border-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Connect Wallet Button */}
          <div className="flex-1 flex items-center justify-center h-screen">
            <button
              onClick={connectWallet}
              className="bg-[#a3ff8f] hover:bg-[#baffb0] text-2xl font-extrabold px-10 py-6 rounded-2xl shadow-lg border-2 border-[#013330] transition duration-300 ease-in-out"
              style={{ color: '#013330', fontFamily: ' Arial Black, sans-serif' }}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect MetaMask Wallet'}
            </button>
          </div>
        </div>
        {/* Features Section */}
        <section id={featuresSectionId} className="w-full py-20 px-4 md:px-32 bg-gradient-to-b from-[#e5ffc3] to-[#fffbe6]" style={{ color: '#013330' }}>
          <h2 className="text-4xl font-bold mb-12 text-center" style={{ fontFamily: ' Arial Black, sans-serif' }}>
            Why MetaCard YieldFlow?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature Card 1 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-orange-200">
              <CreditCardIcon className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-orange-700">Card-Linked DeFi</h3>
              <p className="text-base text-center">Deposit, spend, and withdraw USDC with a virtual card UI. Earn on-chain reputation and unlock NFT badge rewards as you use your card.</p>
            </div>
            {/* Feature Card 2 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-yellow-200">
              <SparklesIcon className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-yellow-700">On-Chain Reputation</h3>
              <p className="text-base text-center">Build your DeFi reputation with every transaction. Hit milestones to mint exclusive NFT badges and rise through card tiers for better perks.</p>
            </div>
            {/* Feature Card 3 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-blue-200">
              <GiftIcon className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-blue-700">Rewards & Perks</h3>
              <p className="text-base text-center">Enjoy cashback, bonus reputation, and exclusive rewards as you level up your card. The more you use, the more you earn!</p>
            </div>
            {/* Feature Card 4 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-green-200">
              <CurrencyDollarIcon className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-green-700">Cross-Chain USDC</h3>
              <p className="text-base text-center">Bridge USDC across chains instantly with LI.FI. Advanced features unlock as your reputation grows.</p>
            </div>
            {/* Feature Card 5 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-purple-200">
              <ClockIcon className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-purple-700">Real-Time Automation</h3>
              <p className="text-base text-center">Automate your DeFi life: get instant notifications, trigger smart actions, and never miss a milestone with n8n integration.</p>
            </div>
            {/* Feature Card 6 */}
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform border-2 border-pink-200">
              <Cog6ToothIcon className="h-12 w-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-pink-700">Modern, Customizable UI</h3>
              <p className="text-base text-center">Enjoy a beautiful, responsive dashboard inspired by MetaMask Card. Personalize your experience with dark/light mode and more.</p>
            </div>
          </div>
        </section>
        {/* About Us Section */}
        <section id={aboutSectionId} className="w-full py-20 px-4 md:px-32 bg-gradient-to-b from-[#fffbe6] to-[#e5ffc3]" style={{ color: '#013330' }}>
          <h2 className="text-4xl font-bold mb-8 animate-section-heading text-center" style={{ fontFamily: 'Montserrat, Impact, Arial Black, sans-serif' }}>
            About the Developer
          </h2>
          <div className="max-w-3xl mx-auto bg-white bg-opacity-90 rounded-2xl shadow-xl p-10 flex flex-col items-center border-2 border-yellow-100">
            <p className="text-lg md:text-xl text-center mb-6 font-medium">
              I architect and develop robust decentralized solutions, leveraging expertise in <span className="font-bold text-orange-600">Rust</span>, <span className="font-bold text-blue-700">Go</span>, and <span className="font-bold text-green-700">Solidity</span>.<br/>
              My focus is on crafting scalable dApps, ensuring secure smart contract development, and building resilient decentralized infrastructure.<br/>
              I am driven by continuous learning and innovation in the Web3 space.
            </p>
            <div className="w-full flex flex-col items-center">
              <p className="text-base md:text-lg text-center mb-4 text-gray-700">
                Always open to <span className="font-bold text-blue-600">collaborations</span>, deep technical discussions, and building the next wave of decentralized innovation.<br/>
                If you're passionate about Web3, DeFi, or want to create something impactful—let's connect and make it happen.
              </p>
              <a href="mailto:madhusahitya.works@gmail.com" className="mt-2 inline-block bg-gradient-to-r from-orange-400 to-yellow-300 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform">
                Get in Touch
              </a>
            </div>
          </div>
        </section>
       
        {/* Footer Section (updated, matches dashboard style) */}
        <footer className="w-full py-10 px-4 bg-gradient-to-t from-[#e5ffc3] to-[#fffbe6] flex flex-col items-center mt-12 glass-footer">
          <div className="flex space-x-8 mb-4">
            {/* LinkedIn */}
            <a href="https://linkedin.com/in/your-linkedin" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <svg className="h-8 w-8 text-blue-700 hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v4.75z"/></svg>
            </a>
            {/* Twitter */}
            <a href="https://twitter.com/your-twitter" target="_blank" rel="noopener noreferrer" title="Twitter">
              <svg className="h-8 w-8 text-blue-400 hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.56c-.89.39-1.84.65-2.84.77a4.93 4.93 0 0 0 2.16-2.72c-.95.56-2 .97-3.13 1.19A4.92 4.92 0 0 0 16.67 3c-2.72 0-4.93 2.21-4.93 4.93 0 .39.04.77.12 1.13C7.69 8.86 4.07 6.94 1.64 4.15c-.43.74-.67 1.6-.67 2.52 0 1.74.89 3.28 2.25 4.18-.83-.03-1.61-.25-2.29-.63v.06c0 2.43 1.73 4.46 4.03 4.92-.42.12-.87.18-1.33.18-.32 0-.63-.03-.93-.09.63 1.97 2.45 3.4 4.6 3.44A9.87 9.87 0 0 1 0 21.54a13.94 13.94 0 0 0 7.56 2.22c9.05 0 14-7.5 14-14v-.64c.96-.7 1.8-1.56 2.46-2.54z"/></svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com/your-github" target="_blank" rel="noopener noreferrer" title="GitHub">
              <svg className="h-8 w-8 text-black hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99.01 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.08.79 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
            </a>
            {/* Hashnode */}
            <a href="https://hashnode.com/@your-hashnode" target="_blank" rel="noopener noreferrer" title="Hashnode">
              <svg className="h-8 w-8 text-[#2962ff]" fill="currentColor" viewBox="0 0 40 40"><g><circle cx="20" cy="20" r="20" fill="#2962ff"/><rect x="10" y="10" width="20" height="20" rx="6" fill="#fff"/></g></svg>
            </a>
            {/* Medium */}
            <a href="https://medium.com/@your-medium" target="_blank" rel="noopener noreferrer" title="Medium">
              <svg className="h-8 w-8 text-black hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 40 40"><g><circle cx="20" cy="20" r="20" fill="#000"/><ellipse cx="14" cy="20" rx="4" ry="8" fill="#fff"/><ellipse cx="26" cy="20" rx="4" ry="8" fill="#fff"/><ellipse cx="20" cy="20" rx="2" ry="8" fill="#fff"/></g></svg>
            </a>
          </div>
          <div className="text-sm text-gray-700 text-center">
            © 2024 MetaCard YieldFlow. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }  

  return (
    <div style={{ minHeight: '100vh', background: '#e5ffc3', color: '#013330', width: '100vw', minWidth: '100vw', position: 'relative' }}>
      {/* Sticky Top Nav Bar (dashboard style) */}
      <nav className="sticky top-0 z-50 w-[98%] mx-auto flex items-center justify-between px-12 py-6 bg-white shadow-sm rounded-2xl glass-nav" style={{ color: '#013330', marginTop: '1rem', fontFamily: ' Arial Black, sans-serif' }}>
        {/* Left: Logo */}
        <div className="flex items-center">
          <span className="font-bold text-lg md:text-3xl tracking-tight" style={{ color: '#013330', fontFamily: 'Arial Black, sans-serif', letterSpacing: '-2px' }}>
          MetaCard YieldFlow
          </span>
        </div>
        {/* Center: Nav Links (dashboard) */}
        <div className="flex items-center space-x-8">
          <button onClick={() => handleNav('home')} className="text-base md:text-xl font-bold hover:underline" style={{ color: '#013330' }}>Home</button>
          <button onClick={() => handleNav('card')} className="text-base md:text-lg font-bold hover:underline" style={{ color: '#013330' }}>Card</button>
          <button onClick={() => handleNav('rewards')} className="text-base md:text-lg font-bold hover:underline" style={{ color: '#013330' }}>Rewards</button>
          <button onClick={() => handleNav('history')} className="text-base md:text-lg font-bold hover:underline" style={{ color: '#013330' }}>History</button>
          <button onClick={() => handleNav('settings')} className="text-base md:text-lg font-bold hover:underline" style={{ color: '#013330' }}>Settings</button>
        </div>
        {/* Right: Account Info or Theme Toggle */}
        <div className="flex items-center space-x-4">
          <button onClick={toggleDarkMode} className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2">
            {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      {/* Main Dashboard Content: Card left, Info right */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full px-4 md:px-16 py-10 gap-10">
        {/* Left: MetaMask Card (vertically centered) */}
        <div className="flex-1 flex items-center justify-center" style={{ minWidth: 340 }}>
          <div ref={cardRef}>
            <VirtualCard account={account!} usdcBalance={usdcBalance} reputationScore={reputationScore} animateBounce={animateBounce} />
          </div>
        </div>
        {/* Right: Dashboard Info Panel */}
        <div className="flex-1 max-w-xl w-full bg-white bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-300" ref={dashboardRef}>
          {/* Confetti animation for new tier */}
          <Confetti show={showConfetti} />
          {/* Dashboard Info Content (balances, actions, history, etc.) */}
          <div className="text-center mb-8">
            <p className="text-gray-700 text-lg mb-2 flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-blue-400 mr-2" />
              Connected Wallet:
            </p>
            <p className="font-mono text-sm break-all bg-gray-100 rounded-md px-3 py-2 inline-block" style={{ color: '#013330' }}>
              {account}
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-lg text-gray-800 bg-gray-100 rounded-lg p-3 shadow-inner">
              <span className="flex items-center">
                <WalletIcon className="h-6 w-6 text-green-400 mr-2" />
                ETH Balance:
              </span>
              <span className="font-semibold">{ethBalance} ETH</span>
            </div>
            <div className="flex items-center justify-between text-lg text-gray-800 bg-gray-100 rounded-lg p-3 shadow-inner">
              <span className="flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 text-teal-400 mr-2" />
                USDC Balance:
              </span>
              <span className="font-semibold">{usdcBalance} USDC</span>
            </div>
            <div className="flex items-center justify-between text-lg text-gray-800 bg-gray-100 rounded-lg p-3 shadow-inner">
              <span className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-yellow-400 mr-2" />
                Reputation Score:
              </span>
              <span className="font-semibold">{reputationScore}</span>
            </div>
            {/* Deposit USDC */}
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 minimal-input"
                disabled={loading}
              />
              <button
                onClick={handleDeposit}
                className="w-40 py-2 px-4 text-base rounded-xl font-bold shadow-lg pastel-btn"
                disabled={loading || !depositAmount || Number(depositAmount) <= 0}
                style={{ background: '#eac2ff' }}
              >
                Deposit USDC
              </button>
            </div>
            {/* Spend USDC */}
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 minimal-input"
                disabled={loading}
              />
              <button
                onClick={handleSpendWithAnimation}
                className="w-40 py-2 px-4 text-base rounded-xl font-bold shadow-lg pastel-btn"
                disabled={loading || !amount || Number(amount) <= 0}
                style={{ background: '#eac2ff' }}
              >
                Spend USDC
              </button>
            </div>
          </div>
          <button
            onClick={() => fetchBalancesAndScore(account!, ethereum!)}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <ArrowPathIcon className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Refreshing...' : 'Refresh Balances & Score'}
          </button>
          {nftOwned && (
            <div className="mt-4 flex items-center justify-center">
              <span className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full font-bold flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2" /> Reputation NFT Badge Earned!
              </span>
            </div>
          )}
          {/* Transaction History */}
          {txHistory.length > 0 && (
            <div ref={historyRef} className="mt-8 bg-gray-200 rounded-xl p-4">
              <h2 className="text-lg font-bold mb-2">Recent Activity</h2>
              <ul className="text-gray-800 text-sm space-y-1">
                {txHistory.map((evt, idx) => (
                  <li key={idx} ref={idx === 0 ? lastTxRef : undefined} className="border-b border-gray-300 pb-1">
                    <span className="font-mono">{evt.event}</span> -
                    <span> {evt.args && evt.args.user ? evt.args.user : evt.args && evt.args[0] ? evt.args[0] : ''}</span>
                    <span> {evt.args && evt.args.amount ? formatUnits(evt.args.amount, 6) : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Withdraw buttons */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 minimal-input"
                disabled={loading}
              />
              <button
                onClick={handleWithdrawUSDC}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition duration-300 ease-in-out pastel-btn"
                disabled={loading || !withdrawAmount || Number(withdrawAmount) <= 0}
                style={{ background: '#eac2ff' }}
              >
                Withdraw USDC
              </button>
            </div>
            <button
              onClick={handleWithdrawETH}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition duration-300 ease-in-out"
              disabled={loading}
            >
              Withdraw 0.01 ETH
            </button>
          </div>
          {/* NFT metadata display */}
          {nftOwned && nftMeta && (
            <div className="mt-6 flex flex-col items-center">
              <img src={nftMeta.image} alt={nftMeta.name} className="h-24 w-24 rounded-full border-4 border-yellow-400 shadow-lg mb-2" />
              <div className="text-yellow-900 font-bold">{nftMeta.name}</div>
              <div className="text-yellow-800 text-xs text-center">{nftMeta.description}</div>
            </div>
          )}
          {/* Toast notification */}
          {toast && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded-xl shadow-lg z-50">
              {toast}
              <button className="ml-4 text-yellow-400 font-bold" onClick={() => setToast(null)}>X</button>
            </div>
          )}
          {/* LI.FI Integration - Enhanced */}
          <div className="mt-10 flex flex-col items-center">
            <button
              className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-white font-extrabold text-lg py-3 px-6 rounded-2xl shadow-2xl mb-2 transition duration-300 ease-in-out transform hover:scale-105 border-2 border-purple-300 hover:border-yellow-400 pastel-btn"
              onClick={() => setShowLifiModal(true)}
              disabled={loading || (Number(reputationScore) < 1)}
              style={{ opacity: loading || (Number(reputationScore) < 1) ? 0.6 : 1, cursor: loading || (Number(reputationScore) < 1) ? 'not-allowed' : 'pointer', background: '#eac2ff' }}
            >
              <span role="img" aria-label="bridge" className="mr-2">🌉</span>
              Bridge USDC Cross-Chain (LI.FI)
            </button>
            {Number(reputationScore) < 1 && (
              <div className="text-xs text-red-500 mt-2 font-semibold text-center max-w-xs">
                Your reputation score is too low to use the cross-chain bridge. Earn reputation by depositing or spending USDC.
              </div>
            )}
          </div>
          {/* Card-Linked Rewards/Perks */}
          <div ref={rewardsRef} className="mb-6 mt-2 flex flex-col items-center">
            <div className="text-sm font-bold text-white bg-gradient-to-r from-orange-400 via-yellow-200 to-orange-500 px-4 py-2 rounded-full shadow-md mb-2" style={{ color: '#013330' }}>
              Card Perks: {getCardTier(Number(reputationScore)).tier} Tier
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-orange-400 via-yellow-200 to-orange-500 h-2.5 rounded-full" style={{ width: `${Math.min(Number(reputationScore), 100)}%` }} />
            </div>
            <div className="text-xs mt-1" style={{ color: '#013330' }}>{Number(reputationScore) < 100 ? `Earn ${100 - Number(reputationScore)} more reputation for Platinum!` : 'Max tier reached!'}</div>
            {/* Card-linked perks */}
            <div className="mt-2 text-xs font-bold bg-white bg-opacity-80 px-3 py-1 rounded-full shadow" style={{ color: '#013330' }}>Cashback: {Math.min(5, Math.floor(Number(reputationScore) / 20) + 1)}% | Bonus Rep per Spend: {Math.min(10, Math.floor(Number(reputationScore) / 10) + 1)}</div>
          </div>
        </div>
        <OneInchCustomSwap />
      </div>
      {/* LI.FI Modal, Settings Modal, etc. remain unchanged */}
      {showLifiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-6 relative w-[400px] h-[600px]">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowLifiModal(false)}
            >
              X
            </button>
            <iframe
              src="https://widget.li.fi/?theme=light&integrator=MetaCardYieldFlow"
              title="LI.FI Widget"
              width="100%"
              height="100%"
              style={{ border: 'none', minHeight: 500, minWidth: 350, borderRadius: 16 }}
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );  
    
  };


export default MetaMaskConnect;
