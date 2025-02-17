// Initialize Particles.js
particlesJS.load('particles-js', 'particles.json', function() {
  console.log('Particles.js loaded');
});

// Solana Connection (Mainnet)
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
let wallet;

// Wallet Connection
const connectWallet = async () => {
  if (window.solana && window.solana.isPhantom) {
    console.log('Phantom wallet found!');
    wallet = window.solana;
    try {
      await wallet.connect();
      console.log('Connected to wallet:', wallet.publicKey.toString());
      alert('Wallet connected: ' + wallet.publicKey.toString());
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      alert('Failed to connect wallet.');
    }
  } else {
    console.error('Phantom wallet not found.');
    alert('Please install Phantom wallet.');
  }
};

// Add event listener to the Connect Wallet button
document.getElementById('connectWallet').addEventListener('click', connectWallet);

// Token Creation
const createToken = async (name, symbol, decimals, image) => {
  if (!wallet || !wallet.publicKey) {
    alert('Please connect your wallet.');
    return;
  }

  // Step 1: Create Mint Account
  const mint = solanaWeb3.Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(82);
  const createMintTx = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: 82,
      lamports,
      programId: solanaWeb3.TOKEN_PROGRAM_ID,
    }),
    solanaWeb3.Token.createInitMintInstruction(
      solanaWeb3.TOKEN_PROGRAM_ID,
      mint.publicKey,
      decimals,
      wallet.publicKey,
      wallet.publicKey
    )
  );

  // Sign and send the transaction
  const signature = await wallet.sendTransaction(createMintTx, connection, {
    signers: [mint],
  });
  await connection.confirmTransaction(signature);
  console.log('Token Mint Created:', mint.publicKey.toString());

  // Step 2: Upload Metadata to Arweave using Metaplex
  const metaplex = new Metaplex(connection);
  const { uri } = await metaplex.nfts().uploadMetadata({
    name,
    symbol,
    image,
  });
  console.log('Metadata URI:', uri);

  return mint.publicKey;
};

// Bonding Curve Logic
const k = 0.01; // Bonding curve constant

const calculatePrice = (supply) => {
  return k * supply;
};

const buyTokens = async (mint, amount) => {
  const supply = await getTokenSupply(mint);
  const price = calculatePrice(supply + amount);
  console.log('Price to buy:', price);
  // Transfer SOL from user to your DApp's wallet
};

const sellTokens = async (mint, amount) => {
  const supply = await getTokenSupply(mint);
  const price = calculatePrice(supply - amount);
  console.log('Price to sell:', price);
  // Transfer SOL from your DApp's wallet to the user
};

const getTokenSupply = async (mint) => {
  const mintInfo = await connection.getTokenSupply(mint);
  return mintInfo.value.amount;
};

// Raydium Integration
const listOnRaydium = async (mint) => {
  const raydium = new Raydium(connection, wallet);
  const pool = await raydium.createPool({
    tokenMint: mint,
    baseMint: solanaWeb3.NATIVE_MINT, // SOL
    baseAmount: 1000000000, // 1 SOL
    tokenAmount: 1000000000, // 1,000,000,000 tokens
  });
  console.log('Pool created:', pool);
};

// Form Submission
document.getElementById('tokenForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tokenName = document.getElementById('tokenName').value;
  const tokenSymbol = document.getElementById('tokenSymbol').value;
  const tokenDecimals = parseInt(document.getElementById('tokenDecimals').value);
  const tokenImage = document.getElementById('tokenImage').files[0];

  // Create Token
  const mint = await createToken(tokenName, tokenSymbol, tokenDecimals, tokenImage);
  alert('Token created successfully! Mint Address: ' + mint.toString());

  // List Token on Raydium
  await listOnRaydium(mint);
  alert('Token listed on Raydium!');
});