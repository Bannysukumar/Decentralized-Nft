// Contract ABI and address
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "tokenURI",
                "type": "string"
            }
        ],
        "name": "NFTMinted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "tokenURI",
                "type": "string"
            }
        ],
        "name": "mintNFT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const contractAddress = '0x2580907764f07022f8cf87b6351ee3c662406870';

// DOM Elements
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const preview = document.getElementById('preview');
const mintNFTBtn = document.getElementById('mintNFT');
const mintStatus = document.getElementById('mintStatus');
const nftList = document.getElementById('nftList');

// Web3 instance
let web3;
let contract;
let accounts;

// Initialize Web3
async function initWeb3() {
    if (window.ethereum) {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Get connected accounts
            accounts = await web3.eth.getAccounts();
            
            // Update UI
            connectWalletBtn.textContent = 'Connected';
            walletInfo.classList.remove('hidden');
            walletAddress.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
            
            // Enable mint button if image is uploaded
            if (preview.src) {
                mintNFTBtn.disabled = false;
            }
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            
        } catch (error) {
            console.error('User denied account access');
        }
    } else {
        console.error('Please install MetaMask!');
    }
}

// Handle account changes
function handleAccountsChanged(newAccounts) {
    if (newAccounts.length === 0) {
        // User disconnected their wallet
        connectWalletBtn.textContent = 'Connect Wallet';
        walletInfo.classList.add('hidden');
        mintNFTBtn.disabled = true;
    } else {
        accounts = newAccounts;
        walletAddress.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
    }
}

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;
            // Store in localStorage
            localStorage.setItem('currentNFTImage', base64Image);
            
            // Display preview
            preview.src = base64Image;
            imagePreview.classList.remove('hidden');
            
            // Enable mint button if wallet is connected
            if (accounts && accounts.length > 0) {
                mintNFTBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }
});

// Mint NFT
mintNFTBtn.addEventListener('click', async () => {
    if (!accounts || accounts.length === 0) {
        alert('Please connect your wallet first!');
        return;
    }

    const base64Image = localStorage.getItem('currentNFTImage');
    if (!base64Image) {
        alert('Please upload an image first!');
        return;
    }

    try {
        mintStatus.textContent = 'Minting NFT...';
        mintStatus.classList.remove('hidden');
        mintNFTBtn.disabled = true;

        // Call the smart contract's mintNFT function
        const result = await contract.methods.mintNFT(accounts[0], base64Image)
            .send({ from: accounts[0] });

        console.log('Minting transaction result:', result);

        // Get the token ID from the NFTMinted event
        const tokenId = result.events.NFTMinted.returnValues.tokenId;

        if (!tokenId) {
            throw new Error('Could not determine token ID');
        }

        // Add the NFT to the gallery
        addNFTToGallery(tokenId, base64Image);

        mintStatus.textContent = `NFT minted successfully! Token ID: ${tokenId}`;
        
        // Clear the current image
        localStorage.removeItem('currentNFTImage');
        imageUpload.value = '';
        imagePreview.classList.add('hidden');
        preview.src = '';
        mintNFTBtn.disabled = true;

    } catch (error) {
        console.error('Error minting NFT:', error);
        mintStatus.textContent = 'Error minting NFT. Please try again.';
        mintNFTBtn.disabled = false;
    }
});

// Add NFT to gallery
function addNFTToGallery(tokenId, imageUrl) {
    const nftElement = document.createElement('div');
    nftElement.className = 'nft-item';
    nftElement.innerHTML = `
        <img src="${imageUrl}" alt="NFT #${tokenId}">
        <p>Token ID: ${tokenId}</p>
    `;
    nftList.prepend(nftElement);
}

// Remove image function
function removeImage() {
    localStorage.removeItem('currentNFTImage');
    imageUpload.value = '';
    imagePreview.classList.add('hidden');
    preview.src = '';
    mintNFTBtn.disabled = true;
}

// Connect wallet button click handler
connectWalletBtn.addEventListener('click', initWeb3); 